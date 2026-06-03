import { parseGameDataCsv } from '@/lib/gameDataParse'

export type { LootItemRow } from '@/lib/gameDataParse'

export async function loadGameDataClient() {
  const [rarityRes, itemsRes] = await Promise.all([
    fetch('/rarity_table.csv'),
    fetch('/item_table.csv'),
  ])
  const [rarityText, itemsText] = await Promise.all([
    rarityRes.text(),
    itemsRes.text(),
  ])
  return parseGameDataCsv(rarityText, itemsText)
}
