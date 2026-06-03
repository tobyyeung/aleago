'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCurrency } from '@/contexts/CurrencyContext'
import { sellInventoryItems } from '@/app/inventory-actions'
import { loadGameDataClient } from '@/lib/loadGameData.client'
import {
  computeOddsDenominator,
  formatOddsLabel,
  getSellPriceFromDenominator,
} from '@/lib/odds'
import { formatCash } from '@/lib/currency'

const SAFELIST = "text-zinc-400 text-green-500 text-blue-600 text-purple-500 text-orange-500 text-red-600 text-cyan-400 text-yellow-400 text-fuchsia-500 text-slate-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"

interface InventoryItem {
  slug: string
  count: number
  color: string
  tier: string
  sellPrice: number
  oddsLabel: string
}

export default function Inventory() {
  const { refreshCash } = useCurrency()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [locked, setLocked] = useState<Record<string, boolean>>({})
  const [selling, setSelling] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setSellError(null)

    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(authUser ? { id: authUser.id } : null)

    if (!authUser) {
      setItems([])
      setSelected({})
      setLocked({})
      setLoading(false)
      return
    }

    try {
      const { rarities, items: lootItems } = await loadGameDataClient()

      const { data } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', authUser.id)

      if (data) {
        const itemCounts = data.reduce<Record<string, number>>((acc, row) => {
          const slug = row.item_slug as string
          acc[slug] = (acc[slug] ?? 0) + 1
          return acc
        }, {})

        const groupedItems = Object.keys(itemCounts)
          .map((slug) => {
            const csvData = lootItems.find((i) => i.item_slug === slug)
            const denominator = computeOddsDenominator(rarities, lootItems, slug)
            const sellPrice =
              denominator !== null ? getSellPriceFromDenominator(denominator) : 0

            return {
              slug,
              count: itemCounts[slug],
              color: csvData?.color ?? 'text-zinc-300',
              tier: csvData?.tier ?? 'unknown',
              sellPrice,
              oddsLabel: denominator !== null ? formatOddsLabel(denominator) : '—',
            }
          })
          .sort((a, b) => b.count - a.count)

        setItems(groupedItems)
        setSelected((prev) => {
          const next: Record<string, number> = {}
          for (const [slug, qty] of Object.entries(prev)) {
            const match = groupedItems.find((i) => i.slug === slug)
            if (match) next[slug] = Math.min(qty, match.count)
          }
          return next
        })
        setLocked((prev) => {
          const next: Record<string, boolean> = {}
          for (const [slug, isLocked] of Object.entries(prev)) {
            if (isLocked && groupedItems.some((i) => i.slug === slug)) next[slug] = true
          }
          return next
        })
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  useEffect(() => {
    if (!user) return
    const key = `aleago_locked_items_${user.id}`
    const raw = window.localStorage.getItem(key)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Record<string, boolean>
      setLocked(parsed ?? {})
    } catch {
      setLocked({})
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const key = `aleago_locked_items_${user.id}`
    window.localStorage.setItem(key, JSON.stringify(locked))
  }, [locked, user])

  const selectOne = (slug: string, maxCount: number) => {
    if (locked[slug]) return
    setSelected((prev) => {
      const next = { ...prev }
      const current = next[slug] ?? 0
      if (current >= maxCount) {
        delete next[slug]
      } else {
        next[slug] = current + 1
      }
      return next
    })
    setSellError(null)
  }

  const toggleLock = (slug: string) => {
    setLocked((prev) => {
      const next = { ...prev }
      if (next[slug]) {
        delete next[slug]
      } else {
        next[slug] = true
      }
      return next
    })
    setSelected((prev) => {
      if (!(slug in prev)) return prev
      const next = { ...prev }
      delete next[slug]
      return next
    })
    setSellError(null)
  }

  const selectedLines = useMemo(() => {
    return items
      .filter((i) => (selected[i.slug] ?? 0) > 0 && !locked[i.slug])
      .map((i) => ({ slug: i.slug, quantity: selected[i.slug] }))
  }, [items, selected, locked])

  const selectedTotal = useMemo(() => {
    return items
      .filter((i) => (selected[i.slug] ?? 0) > 0 && !locked[i.slug])
      .reduce((sum, i) => sum + i.sellPrice * (selected[i.slug] ?? 0), 0)
  }, [items, selected, locked])

  const selectedCount = useMemo(() => {
    return Object.values(selected).reduce((sum, qty) => sum + qty, 0)
  }, [selected])

  const unlockedLines = useMemo(() => {
    return items
      .filter((i) => !locked[i.slug] && i.count > 0)
      .map((i) => ({ slug: i.slug, quantity: i.count }))
  }, [items, locked])

  const unlockedCount = useMemo(() => {
    return unlockedLines.reduce((sum, line) => sum + line.quantity, 0)
  }, [unlockedLines])

  const selectAllUnlocked = () => {
    const next: Record<string, number> = {}
    for (const line of unlockedLines) {
      next[line.slug] = line.quantity
    }
    setSelected(next)
    setSellError(null)
  }

  const handleSell = async () => {
    if (!selectedLines.length || selling) return

    setSelling(true)
    setSellError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setSellError('Not authenticated')
        return
      }

      const result = await sellInventoryItems(token, selectedLines)
      if (!result.success) {
        setSellError(result.error)
        return
      }

      setSelected({})
      await Promise.all([loadInventory(), refreshCash()])
    } finally {
      setSelling(false)
    }
  }

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-10 pb-28">
      <div className="mb-6 sm:mb-8 border-b border-zinc-800 pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">INVENTORY</h1>
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
          Sector_07 Storage
        </span>
        {items.length > 0 && (
          <p className="text-[10px] text-zinc-600 font-mono mt-2 uppercase">
            Tap item to select +1 · Tap lock icon to protect item from selling
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-500 font-mono animate-pulse uppercase text-sm">Accessing databanks...</p>
      ) : !user ? (
        <p className="text-red-500 font-mono text-sm uppercase">Authentication required to view inventory.</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500 font-mono text-sm uppercase">Storage empty. Initiate rolls to acquire items.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item) => {
            const selectedQty = selected[item.slug] ?? 0
            const isSelected = selectedQty > 0
            const isLocked = !!locked[item.slug]
            const canSell = item.sellPrice > 0 && !isLocked
            return (
              <div
                key={item.slug}
                role="button"
                tabIndex={canSell ? 0 : -1}
                onClick={() => canSell && selectOne(item.slug, item.count)}
                onKeyDown={(event) => {
                  if (!canSell) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectOne(item.slug, item.count)
                  }
                }}
                className={`bg-zinc-950 border rounded-xl p-4 flex flex-col items-center justify-center aspect-square transition-colors relative text-left w-full disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-lime-500 ring-2 ring-lime-500/40'
                    : isLocked
                      ? 'border-amber-500/70'
                      : 'border-zinc-800 hover:border-zinc-600 cursor-pointer'
                }`}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    toggleLock(item.slug)
                  }}
                  className={`absolute top-2 left-2 w-6 h-6 rounded-full border flex items-center justify-center text-xs transition-colors ${
                    isLocked
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                  }`}
                  aria-label={isLocked ? `Unlock ${item.slug}` : `Lock ${item.slug}`}
                  title={isLocked ? 'Unlock item' : 'Lock item'}
                >
                  {isLocked ? '🔒' : '🔓'}
                </button>

                {isSelected && (
                  <div className="absolute top-2 left-10 w-4 h-4 rounded-full bg-lime-500 flex items-center justify-center">
                    <span className="text-[9px] font-black text-black">{selectedQty}</span>
                  </div>
                )}

                <div className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded">
                  x{item.count}
                </div>

                <span className={`text-sm font-mono tracking-tight capitalize text-center line-clamp-2 ${item.color}`}>
                  {item.slug}
                </span>

                <div className="w-12 h-12 border border-zinc-800 border-dashed rounded my-2 flex items-center justify-center text-[8px] text-zinc-700">
                  [IMG]
                </div>

                <span className="text-[8px] uppercase tracking-widest text-zinc-600 mt-0.5">
                  {item.tier}
                </span>

                <span className="text-xs font-mono font-bold text-lime-400 mt-1">
                  ${formatCash(item.sellPrice)}
                  {item.count > 1 && (
                    <span className="text-zinc-600 font-normal"> ea</span>
                  )}
                </span>
                {isLocked && (
                  <span className="text-[9px] font-mono text-amber-300 mt-1 uppercase tracking-wider">
                    Locked
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {sellError && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-red-500 font-mono text-xs uppercase z-50">
          {sellError}
        </p>
      )}

      {(selectedCount > 0 || unlockedCount > 0) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-mono text-zinc-400">
            {selectedCount > 0 ? (
              <>
                <span className="text-white font-bold">{selectedCount}</span> item{selectedCount !== 1 ? 's' : ''} selected
              </>
            ) : (
              <>
                <span className="text-white font-bold">{unlockedCount}</span> unlocked item{unlockedCount !== 1 ? 's' : ''}
              </>
            )}
          </p>
          <div className="flex w-full sm:w-auto gap-2">
            <button
              type="button"
              onClick={selectAllUnlocked}
              disabled={selling || unlockedCount === 0}
              className="w-full sm:w-auto px-4 py-3 border border-zinc-700 text-zinc-200 rounded-full font-black text-xs tracking-[0.1em] hover:bg-zinc-900 disabled:opacity-40 transition-colors"
            >
              SELECT ALL
            </button>
            <button
              type="button"
              onClick={() => setSelected({})}
              disabled={selling || selectedCount === 0}
              className="w-full sm:w-auto px-4 py-3 border border-zinc-700 text-zinc-200 rounded-full font-black text-xs tracking-[0.1em] hover:bg-zinc-900 disabled:opacity-40 transition-colors"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={handleSell}
              disabled={selling || selectedCount === 0}
              className="w-full sm:w-auto px-6 py-3 bg-lime-500 text-black rounded-full font-black text-xs tracking-[0.15em] hover:bg-lime-400 disabled:opacity-40 transition-colors"
            >
              {selling ? 'SELLING...' : `SELL FOR $${formatCash(selectedTotal)}`}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
