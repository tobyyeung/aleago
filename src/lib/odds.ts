export type RarityTier = {
  rarity: string
  weight: number
}

export type LootItemRef = {
  item_slug: string
  tier: string
  weight: number
}

/** True drop odds denominator (1/X). Sell price = X dollars per item. */
export function computeOddsDenominator(
  rarities: RarityTier[],
  items: LootItemRef[],
  itemSlug: string
): number | null {
  const item = items.find((i) => i.item_slug === itemSlug)
  if (!item || rarities.length === 0) return null

  const rarity = rarities.find((r) => r.rarity === item.tier)
  if (!rarity) return null

  const totalRarityWeight = rarities.reduce((sum, r) => sum + r.weight, 0)
  const tierItems = items.filter((i) => i.tier === item.tier)
  const totalItemWeight = tierItems.reduce((sum, i) => sum + i.weight, 0)
  if (totalRarityWeight <= 0 || totalItemWeight <= 0 || item.weight <= 0) return null

  const probability =
    (rarity.weight / totalRarityWeight) * (item.weight / totalItemWeight)
  if (probability <= 0) return null

  return Math.round(1 / probability)
}

export function formatOddsLabel(denominator: number): string {
  if (denominator >= 1_000_000) {
    return `1 / ${(denominator / 1_000_000).toFixed(1)}M`
  }
  if (denominator >= 1000) {
    return `1 / ${denominator.toLocaleString('en-US')}`
  }
  return `1 / ${denominator}`
}

/** Sell price in dollars equals the 1/X denominator. */
export function getSellPriceFromDenominator(denominator: number): number {
  return denominator
}
