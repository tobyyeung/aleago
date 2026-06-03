import Papa from 'papaparse'
import type { RarityTier } from '@/lib/odds'

export type LootItemRow = {
  item_slug: string
  tier: string
  weight: number
  color: string
}

export function parseRarities(csvText: string): RarityTier[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  return data.map((row) => ({
    rarity: row.rarity?.trim() ?? '',
    weight: Number(row.weight),
  }))
}

export function parseItems(csvText: string): LootItemRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  return data.map((row) => ({
    item_slug: row.item_slug?.trim() ?? '',
    tier: row.tier?.trim() ?? '',
    weight: Number(row.weight),
    color:
      row.color?.trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '') ?? 'text-zinc-300',
  }))
}

export function parseGameDataCsv(rarityText: string, itemsText: string) {
  return {
    rarities: parseRarities(rarityText),
    items: parseItems(itemsText),
  }
}
