'use client'

import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCash } from '@/lib/currency'
import type { User } from '@supabase/supabase-js'

const SIZES = {
  containerPadding: "px-3 py-1.5 sm:px-4 sm:py-2",
  avatarSize: "w-5 h-5 sm:w-6 sm:h-6",
  labelText: "text-[10px] sm:text-xs",
  valueText: "text-sm sm:text-base",
}

export function CurrencyDisplay({ user }: { user: User }) {
  const { cash, loading } = useCurrency()

  return (
    <div
      className={`flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg ${SIZES.containerPadding}`}
      aria-live="polite"
      aria-label={`Cash balance: ${cash}`}
    >
      {user.user_metadata?.avatar_url ? (
        <img 
          src={user.user_metadata.avatar_url} 
          alt="Profile" 
          className={`${SIZES.avatarSize} rounded-full object-cover`} 
        />
      ) : (
        <div className={`${SIZES.avatarSize} rounded-full bg-zinc-800 flex items-center justify-center shrink-0`}>
          <span className="text-[10px] text-zinc-400 font-bold">
            {user.email?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
      )}
      <span className={`${SIZES.labelText} font-mono text-zinc-500 uppercase tracking-widest`}>
        Cash
      </span>
      <span className={`${SIZES.valueText} font-mono font-bold text-lime-400 tabular-nums`}>
        {loading ? '—' : `$${formatCash(cash)}`}
      </span>
    </div>
  )
}
