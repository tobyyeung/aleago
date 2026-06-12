'use client'

import { useState, useRef, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { supabase } from '@/lib/supabaseClient'
import { adjustCash } from '@/app/currency-actions'
import { PLINKO_MULTIPLIERS, generatePlinkoDrop } from '@/lib/games/plinko'

type GameStatus = 'idle' | 'playing'

export function PlinkoGame() {
  const { cash, refreshCash, loading: currencyLoading } = useCurrency()
  const [status, setStatus] = useState<GameStatus>('idle')
  const [betAmount, setBetAmount] = useState<number>(10)
  const [rows, setRows] = useState<number>(8)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Ball animation state
  const [isDropping, setIsDropping] = useState(false)
  const ballRef = useRef<HTMLDivElement>(null)
  const [winAmount, setWinAmount] = useState<number | null>(null)

  // Drop configuration
  const DROP_DURATION = 350 // ms per peg jump

  async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleBet() {
    if (status === 'playing' || actionLoading) return
    if (betAmount <= 0) return setErrorMsg('Bet amount must be greater than 0')
    if (betAmount > cash) return setErrorMsg('Insufficient funds')

    setActionLoading(true)
    const token = await getAccessToken()
    if (!token) {
      setErrorMsg('You must be logged in to play')
      setActionLoading(false)
      return
    }

    const res = await adjustCash(token, -betAmount)
    if (!res.success) {
      setErrorMsg(`Error: ${res.error}`)
      setActionLoading(false)
      return
    }

    await refreshCash()
    setStatus('playing')
    setWinAmount(null)
    setActionLoading(false)

    // Generate drop path
    const drop = generatePlinkoDrop(rows)
    
    // Start animation sequence
    runDropAnimation(drop.path, drop.multiplier, token)
  }

  async function runDropAnimation(path: number[], multiplier: number, token: string) {
    setIsDropping(true)

    return new Promise<void>((resolve) => {
      let startTimestamp: number | null = null

      function animate(timestamp: number) {
        if (!startTimestamp) startTimestamp = timestamp
        const elapsed = timestamp - startTimestamp

        // Determine which segment of the path we are in
        const stepFloat = elapsed / DROP_DURATION
        const stepIndex = Math.floor(stepFloat)
        
        if (stepIndex >= path.length + 1) {
          // Reached the end (the slot)
          finishAnimation(multiplier, token)
          resolve()
          return
        }

        const t = stepFloat - stepIndex // 0 to 1 progress within this segment

        let rStart: number, pegStart: number, rEnd: number, pegEnd: number

        if (stepIndex === 0) {
          // Drop from above to the first peg
          rStart = -1
          pegStart = 0
          rEnd = 0
          pegEnd = 0
        } else {
          // Calculate the peg at the start of this step
          let tempPeg = 0
          for(let i=0; i<stepIndex-1; i++) {
            tempPeg += path[i]
          }
          rStart = stepIndex - 1
          pegStart = tempPeg

          rEnd = stepIndex
          pegEnd = tempPeg + path[stepIndex - 1]
        }

        // Calculate positions
        const startX = getX(Math.max(0, rStart), pegStart) 
        const endX = getX(rEnd, pegEnd)
        
        // Y starts at 0% for the initial drop
        const startY = rStart === -1 ? 0 : getY(rStart)
        const endY = getY(rEnd)

        // Interpolate X linearly
        const currentX = startX + (endX - startX) * t

        // Interpolate Y with pseudo-gravity bounce (parabola)
        // We only bounce if we hit a peg (rStart >= 0). No bounce on the initial drop.
        // We reduce the bounce height on the final drop into the slot.
        const bounceHeight = rStart === -1 ? 0 : (stepIndex === path.length ? 1 : 4)
        const currentY = startY + (endY - startY) * t - (bounceHeight * Math.sin(t * Math.PI))

        if (ballRef.current) {
          ballRef.current.style.left = `${currentX}%`
          ballRef.current.style.top = `${currentY}%`
        }

        requestAnimationFrame(animate)
      }

      requestAnimationFrame(animate)
    })
  }

  async function finishAnimation(multiplier: number, token: string) {
    const winnings = Math.floor(betAmount * multiplier)
    if (winnings > 0) {
      await adjustCash(token, winnings)
      await refreshCash()
    }
    
    setWinAmount(winnings)
    setTimeout(() => {
      setStatus('idle')
      setIsDropping(false)
    }, 1500)
  }

  // Calculate X and Y percentages
  const getX = (r: number, peg: number) => {
    const slotWidth = 100 / (rows + 2)
    return 50 + (peg - r / 2) * slotWidth
  }
  const getY = (r: number) => {
    const step = 85 / rows
    return 5 + r * step
  }

  return (
    <>
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl max-w-xs w-full flex flex-col items-center text-center gap-4 transform transition-all">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2 border border-red-500/20">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-white font-black text-xl uppercase tracking-wider">Error</h3>
              <p className="text-zinc-400 text-sm font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="w-full mt-4 py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 lg:gap-10 h-full w-full max-w-6xl mx-auto">
        {/* Controls Panel */}
        <div className="w-full md:w-80 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Bet Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
              <input 
                type="number" 
                min="0"
                step="1"
                value={betAmount || ''}
                onChange={(e) => {
                  let val = Math.floor(Number(e.target.value))
                  if (val > cash) val = Math.floor(cash)
                  if (val < 0) val = 0
                  setBetAmount(val)
                }}
                disabled={status !== 'idle'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-8 pr-4 text-white font-mono font-bold focus:outline-none focus:border-zinc-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[10, 100, 1000].map((amt) => (
                <button
                  key={`add-${amt}`}
                  onClick={() => setBetAmount(prev => Math.min(prev + amt, Math.floor(cash)))}
                  disabled={status !== 'idle'}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold py-2 rounded transition-colors text-zinc-300"
                >
                  +{amt}
                </button>
              ))}
            </div>
            <div className="relative py-1">
              <input
                type="range"
                min="0"
                max={Math.max(0, Math.floor(cash))}
                step="1"
                value={betAmount || 0}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={status !== 'idle'}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-lime-400"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[10, 100, 1000].map((amt) => (
                <button
                  key={`sub-${amt}`}
                  onClick={() => setBetAmount(prev => Math.max(0, prev - amt))}
                  disabled={status !== 'idle'}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold py-2 rounded transition-colors text-zinc-300"
                >
                  -{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Rows</label>
              <span className="text-sm font-mono font-bold text-lime-400">{rows}</span>
            </div>
            <div className="relative pt-2 pb-2">
              <input
                type="range"
                min="8"
                max="16"
                step="4"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                disabled={status !== 'idle'}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-lime-400"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-2 px-1">
                <span>8</span>
                <span>12</span>
                <span>16</span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            {winAmount !== null && (
              <div className={`px-4 py-2 rounded-lg font-black uppercase tracking-widest text-center ${winAmount > betAmount ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                {winAmount > betAmount ? `You Won $${winAmount}!` : `Payout $${winAmount}`}
              </div>
            )}
            <button
              onClick={handleBet}
              disabled={status !== 'idle' || actionLoading || currencyLoading}
              className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-colors"
            >
              {status === 'idle' ? 'Bet' : 'Dropping...'}
            </button>
          </div>
        </div>

        {/* Game Board Panel */}
        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-4 sm:p-10 relative overflow-hidden">
          <div className="w-full max-w-[500px] aspect-[4/3] relative">
            
            {/* Render Pegs */}
            {Array.from({ length: rows }).map((_, r) => (
              Array.from({ length: r + 1 }).map((_, peg) => {
                const x = getX(r, peg)
                const y = getY(r)
                return (
                  <div
                    key={`peg-${r}-${peg}`}
                    className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-zinc-700 rounded-full shadow-[0_0_8px_rgba(63,63,70,0.5)] transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  />
                )
              })
            ))}

            {/* Render Multiplier Slots */}
            {PLINKO_MULTIPLIERS[rows].map((mult, peg) => {
              const x = getX(rows, peg)
              const y = getY(rows)
              // Color slots based on multiplier
              const isHigh = mult >= 10
              const isMid = mult >= 2 && mult < 10
              
              const textSizeClass = rows >= 16 
                ? 'text-[6px] sm:text-[7px]' 
                : rows >= 12 
                  ? 'text-[7px] sm:text-[8px]' 
                  : 'text-[9px] sm:text-[10px]'

              return (
                <div
                  key={`slot-${peg}`}
                  className={`absolute h-6 sm:h-8 rounded flex items-center justify-center ${textSizeClass} font-black transform -translate-x-1/2 -translate-y-1/2 overflow-hidden ${
                    isHigh ? 'bg-red-500 text-white' : isMid ? 'bg-orange-400 text-black' : 'bg-lime-400 text-black'
                  }`}
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    width: `calc(100% / ${rows + 2} - 4px)`
                  }}
                >
                  {mult}x
                </div>
              )
            })}

            {/* Render Ball */}
            {isDropping && (
              <div
                ref={ballRef}
                className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: '50%', top: '0%' }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
