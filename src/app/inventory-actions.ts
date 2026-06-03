'use server'

import { createClient } from '@supabase/supabase-js'
import { adjustCash } from '@/app/currency-actions'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { computeOddsDenominator, getSellPriceFromDenominator } from '@/lib/odds'
import { loadGameDataServer } from '@/lib/loadGameData.server'

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

export type SellLine = { slug: string; quantity: number }

export async function sellInventoryItems(accessToken: string, lines: SellLine[]) {
  const user = await getUserFromToken(accessToken)
  if (!user) return { success: false as const, error: 'Not authenticated' }

  if (!lines.length) return { success: false as const, error: 'Nothing selected' }

  for (const line of lines) {
    if (!line.slug || !Number.isInteger(line.quantity) || line.quantity < 1) {
      return { success: false as const, error: 'Invalid sell request' }
    }
  }

  const { rarities, items } = await loadGameDataServer()
  let totalPayout = 0

  for (const line of lines) {
    const denominator = computeOddsDenominator(rarities, items, line.slug)
    if (denominator === null) {
      return { success: false as const, error: `Unknown item: ${line.slug}` }
    }
    totalPayout += getSellPriceFromDenominator(denominator) * line.quantity
  }

  if (!Number.isInteger(totalPayout) || totalPayout < 1) {
    return { success: false as const, error: 'Invalid payout' }
  }

  for (const line of lines) {
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from('inventory')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_slug', line.slug)
      .limit(line.quantity)

    if (fetchError) return { success: false as const, error: fetchError.message }
    if (!rows || rows.length < line.quantity) {
      return { success: false as const, error: `Not enough ${line.slug} to sell` }
    }

    const ids = rows.map((r) => r.id)
    const { error: deleteError } = await supabaseAdmin
      .from('inventory')
      .delete()
      .in('id', ids)

    if (deleteError) return { success: false as const, error: deleteError.message }
  }

  const cashResult = await adjustCash(accessToken, totalPayout)
  if (!cashResult.success) return { success: false as const, error: cashResult.error }

  return {
    success: true as const,
    cash: cashResult.cash,
    earned: totalPayout,
  }
}
