'use client'

import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCash } from '@/lib/currency'

export function CurrencyDisplay() {
  const { cash, loading } = useCurrency()

  return (
    <div
      className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2"
      aria-live="polite"
      aria-label={`Cash balance: ${cash}`}
    >
      <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest">
        Cash
      </span>
      <span className="text-sm sm:text-base font-mono font-bold text-lime-400 tabular-nums">
        {loading ? '—' : `$${formatCash(cash)}`}
      </span>
    </div>
  )
}
