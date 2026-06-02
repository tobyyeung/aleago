'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Papa from 'papaparse'

// --- ADD THIS LINE ---
// This forces Tailwind to "see" and keep these colors during the build process!
const SAFELIST = "text-zinc-400 text-green-500 text-blue-600 text-purple-500 text-orange-500 text-red-600 text-cyan-400 text-yellow-400 text-fuchsia-500 text-slate-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"

// 1. Define our two new data types
interface RarityTier {
  rarity: string;
  weight: number;
  color: string;
}

interface LootItem {
  item_slug: string;
  tier: string;
  weight: number;
  color: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [lastItem, setLastItem] = useState("???")
  const [chance, setChance] = useState("")
  const [lastColor, setLastColor] = useState("text-zinc-600")
  const [rolling, setRolling] = useState(false)
  
  // State for our two CSV databases
  const [rarities, setRarities] = useState<RarityTier[]>([])
  const [allItems, setAllItems] = useState<LootItem[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/ping.mp3')

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // 2. Load BOTH CSV files at the same time and sanitize the strings
    async function loadGameData() {
      try {
        const [rarityRes, itemsRes] = await Promise.all([
          fetch('/rarity_table.csv'),
          fetch('/item_table.csv')
        ])
        
        const rarityText = await rarityRes.text()
        const itemsText = await itemsRes.text()

        Papa.parse(rarityText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Sanitize string fields
            const cleaned = results.data.map((r: any) => ({
              ...r,
              rarity: r.rarity?.trim(),
              color: r.color?.trim().replace(/^"|"$/g, '')
            }))
            setRarities(cleaned)
          }
        })

        Papa.parse(itemsText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Sanitize item text and scrub hidden newlines/quotes from CSV formatting
            const cleaned = results.data.map((item: any) => ({
              ...item,
              item_slug: item.item_slug?.trim(),
              tier: item.tier?.trim(),
              color: item.color?.trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '')
            }))
            setAllItems(cleaned)
          }
        })
      } catch (error) {
        console.error("Failed to load CSVs:", error)
      }
    }
    
    loadGameData()
  }, [])

  const roll = async () => {
    // Make sure both CSVs are fully loaded before letting the user roll
    if (rolling || rarities.length === 0 || allItems.length === 0) return 
    
    setRolling(true)
    
    // --- STEP 1: ROLL FOR RARITY TIER ---
    const totalRarityWeight = rarities.reduce((sum, r) => sum + r.weight, 0)
    let rarityTicket = Math.floor(Math.random() * totalRarityWeight)
    let wonRarity = rarities[0]

    for (const r of rarities) {
      if (rarityTicket < r.weight) {
        wonRarity = r
        break
      }
      rarityTicket -= r.weight
    }

    // --- STEP 2: ROLL FOR ITEM WITHIN THAT TIER ---
    // Filter the massive item list down to JUST the items that match the won rarity
    const possibleItems = allItems.filter(item => item.tier === wonRarity.rarity)
    
    // Fallback in case a tier has no items yet
    if (possibleItems.length === 0) {
      console.error(`No items found for tier: ${wonRarity.rarity}`)
      setRolling(false)
      return
    }

    const totalItemWeight = possibleItems.reduce((sum, item) => sum + item.weight, 0)
    let itemTicket = Math.floor(Math.random() * totalItemWeight)
    let wonItem = possibleItems[0]

    for (const item of possibleItems) {
      if (itemTicket < item.weight) {
        wonItem = item
        break
      }
      itemTicket -= item.weight
    }

    // --- EXECUTE ROLL UI & SAVE ---
    await new Promise(r => setTimeout(r, 1000))

    if (audioRef.current) {
      audioRef.current.currentTime = 0 
      audioRef.current.play().catch(e => console.log("Audio blocked"))
    }

    if (user) {
      const { error } = await supabase
        .from('inventory')
        .insert([{ user_id: user.id, item_slug: wonItem.item_slug, item_type: 'material' }])
        
      if (error) {
        console.error("Error saving:", JSON.stringify(error, null, 2))
      }
    }
    
    setLastItem(wonItem.item_slug)
    
    // --- CHANGE TEXT COLOR BASED ON ITEM CSV ---
    setLastColor(wonItem.color) 
    
    // --- CALCULATE TRUE FRACTIONAL ODDS (e.g., 1 / 250) ---
    const rarityProbability = wonRarity.weight / totalRarityWeight
    const itemProbabilityInTier = wonItem.weight / totalItemWeight
    const totalProbability = rarityProbability * itemProbabilityInTier
    
    // Invert the probability to get the "1 out of X" denominator
    const rawDenominator = 1 / totalProbability
    
    let formattedFraction = ""
    if (rawDenominator >= 1000000) {
      // For mega rare drops like Ascended, format as millions (e.g., 1 / 10.6M)
      formattedFraction = `1 / ${(rawDenominator / 1000000).toFixed(1)}M`
    } else if (rawDenominator >= 1000) {
      // For thousands, format with a comma (e.g., 1 / 2,500)
      formattedFraction = `1 / ${Math.round(rawDenominator).toLocaleString()}`
    } else {
      // For regular common drops, format cleanly (e.g., 1 / 4)
      formattedFraction = `1 / ${Math.round(rawDenominator)}`
    }
    
    setChance(formattedFraction)
    
    setRolling(false)
  }

  return (
    <>
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16 sm:px-6 md:pb-20">
        <div className="w-full max-w-[20rem] sm:max-w-[22rem] md:max-w-[24rem] min-h-[16rem] sm:min-h-[18rem] border border-zinc-800 rounded-3xl sm:rounded-[2.5rem] mb-6 sm:mb-8 md:mb-10 flex flex-col items-center justify-center bg-zinc-950 shadow-2xl relative p-4 sm:p-6">
          
          <span className={`text-xl sm:text-2xl md:text-3xl font-mono tracking-tight transition-all duration-300 capitalize text-center px-2 ${lastColor} ${rolling ? 'opacity-20 blur-md' : 'opacity-100'}`}>
            {lastItem}
          </span>

          <div className={`mt-3 sm:mt-4 text-xs font-mono text-zinc-600 border border-zinc-800 border-dashed rounded flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 transition-all ${rolling ? 'opacity-20 blur-md' : 'opacity-100'}`}>
            [IMAGE]
          </div>
          
          <div className="min-h-8 mt-3 sm:mt-4">
            {!rolling && chance && (
              <span className="text-xs sm:text-sm font-mono text-zinc-500 tracking-tighter animate-in fade-in zoom-in duration-300">
                {chance}
              </span>
            )}
            {rolling && (
              <span className="text-xs font-mono text-zinc-700 animate-pulse uppercase tracking-[0.2em]">
                Scanning...
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={roll}
          disabled={rolling || !user || rarities.length === 0 || allItems.length === 0}
          className="w-full max-w-[10rem] sm:max-w-[11rem] py-3 sm:py-4 bg-white text-black rounded-full font-black tracking-[0.2em] text-xs hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-10"
        >
          {rolling ? "ROLLING" : "ROLL"}
        </button>
        
        {!user && <p className="mt-4 sm:mt-6 text-zinc-600 text-[10px] uppercase tracking-widest animate-pulse text-center">Authentication Required</p>}
      </main>

      <footer className="shrink-0 pb-6 sm:pb-8 md:pb-10 text-center opacity-10 text-[8px] sm:text-[10px] font-mono tracking-[0.3em] sm:tracking-[0.5em]">
        SYSTEM_READY // SECTOR_07
      </footer>
    </>
  )
}