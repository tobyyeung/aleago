'use server'

import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { STARTING_CASH } from '@/lib/currency'

const CURRENCY_COLUMNS = ['cash', 'money', 'balance'] as const

async function getUserFromToken(accessToken: string) {
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error } = await authClient.auth.getUser(accessToken)
  if (error || !user) return null
  return user
}

async function resolveCurrencyColumn(): Promise<(typeof CURRENCY_COLUMNS)[number] | null> {
  for (const column of CURRENCY_COLUMNS) {
    const { error } = await supabaseAdmin.from('profiles').select(column).limit(1)
    if (!error) return column
    if (!error.message.includes('does not exist')) return null
  }
  return null
}

function readNumericField(row: unknown, field: string, fallback = 0): number {
  if (!row || typeof row !== 'object') return fallback
  const value = (row as Record<string, unknown>)[field]
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function ensureProfile(accessToken: string) {
  const user = await getUserFromToken(accessToken)
  if (!user) return { success: false as const, error: 'Not authenticated' }

  const currencyColumn = await resolveCurrencyColumn()
  if (!currencyColumn) return { success: false as const, error: 'No currency column found on profiles table' }

  const { error } = await supabaseAdmin.from('profiles').upsert(
    { id: user.id, [currencyColumn]: STARTING_CASH, total_earned: 0 },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  if (error) return { success: false as const, error: error.message }
  return { success: true as const }
}

export async function getProfileCash(accessToken: string) {
  const user = await getUserFromToken(accessToken)
  if (!user) return { success: false as const, error: 'Not authenticated', cash: 0 }

  const currencyColumn = await resolveCurrencyColumn()
  if (!currencyColumn) return { success: false as const, error: 'No currency column found on profiles table', cash: 0 }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(currencyColumn)
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { success: false as const, error: error.message, cash: 0 }
  if (!data) {
    await supabaseAdmin.from('profiles').insert({ id: user.id, [currencyColumn]: STARTING_CASH, total_earned: 0 })
    return { success: true as const, cash: STARTING_CASH }
  }

  return { success: true as const, cash: readNumericField(data, currencyColumn, STARTING_CASH) }
}

/** Server-only balance changes (sell, arcade, etc.) */
export async function adjustCash(accessToken: string, delta: number) {
  if (!Number.isInteger(delta)) {
    return { success: false as const, error: 'Invalid amount' }
  }

  const user = await getUserFromToken(accessToken)
  if (!user) return { success: false as const, error: 'Not authenticated' }

  const currencyColumn = await resolveCurrencyColumn()
  if (!currencyColumn) return { success: false as const, error: 'No currency column found on profiles table' }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select(`${currencyColumn}, total_earned`)
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) return { success: false as const, error: fetchError.message }

  const currentCash = profile ? readNumericField(profile, currencyColumn, STARTING_CASH) : STARTING_CASH
  const nextCash = currentCash + delta
  if (nextCash < 0) return { success: false as const, error: 'Insufficient funds' }

  const totalEarned =
    profile && delta > 0
      ? readNumericField(profile, 'total_earned', 0) + delta
      : profile
        ? readNumericField(profile, 'total_earned', 0)
        : delta > 0
          ? delta
          : 0

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user.id,
      [currencyColumn]: nextCash,
      total_earned: totalEarned,
    })
    .select(currencyColumn)
    .single()

  if (updateError) return { success: false as const, error: updateError.message }
  return { success: true as const, cash: readNumericField(updated, currencyColumn, STARTING_CASH) }
}
