'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { ensureProfile, getProfileCash } from '@/app/currency-actions'

type CurrencyContextValue = {
  cash: number
  setCash: (cash: number) => void
  loading: boolean
  refreshCash: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  const [cash, setCash] = useState(0)
  const [loading, setLoading] = useState(false)

  const refreshCash = useCallback(async () => {
    if (!user) {
      setCash(0)
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setCash(0)
        return
      }

      await ensureProfile(token)
      const result = await getProfileCash(token)
      if (result.success) setCash(result.cash)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshCash()
  }, [refreshCash])

  const value = useMemo(
    () => ({ cash, setCash, loading, refreshCash }),
    [cash, loading, refreshCash]
  )

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
