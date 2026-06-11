'use client'

import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCash } from '@/lib/currency'

const SIZES = {
  containerPadding: "px-3 py-1.5 sm:px-4 sm:py-2",
  labelText: "text-[10px] sm:text-xs",
  valueText: "text-sm sm:text-base",
}

export function CurrencyDisplay() {
  const { cash, loading } = useCurrency()

  return (
    <div
      className={`flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg ${SIZES.containerPadding}`}
      aria-live="polite"
      aria-label={`Cash balance: ${cash}`}
    >
      <span className={`${SIZES.labelText} font-mono text-zinc-500 uppercase tracking-widest`}>
        Cash
      </span>
      <span className={`${SIZES.valueText} font-mono font-bold text-lime-400 tabular-nums`}>
        {loading ? '—' : `$${formatCash(cash)}`}
      </span>
    </div>
  )
}
