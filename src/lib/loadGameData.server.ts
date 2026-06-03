import 'server-only'

import { readFile } from 'fs/promises'
import path from 'path'
import type { RarityTier } from '@/lib/odds'
import { parseGameDataCsv, type LootItemRow } from '@/lib/gameDataParse'

let cached: { rarities: RarityTier[]; items: LootItemRow[] } | null = null

export async function loadGameDataServer() {
  if (cached) return cached

  const publicDir = path.join(process.cwd(), 'public')
  const [rarityText, itemsText] = await Promise.all([
    readFile(path.join(publicDir, 'rarity_table.csv'), 'utf-8'),
    readFile(path.join(publicDir, 'item_table.csv'), 'utf-8'),
  ])

  cached = parseGameDataCsv(rarityText, itemsText)
  return cached
}
