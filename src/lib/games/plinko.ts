export const PLINKO_MULTIPLIERS: Record<number, number[]> = {
  8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  12: [170, 24, 8.1, 1.9, 1.2, 0.2, 0.2, 0.2, 1.2, 1.9, 8.1, 24, 170],
  16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
}

export type PlinkoDropResult = {
  path: number[] // array of 0 (left) or 1 (right)
  slotIndex: number // final index where the ball lands
  multiplier: number // final multiplier
}

export function generatePlinkoDrop(rows: number): PlinkoDropResult {
  if (!PLINKO_MULTIPLIERS[rows]) {
    throw new Error(`Invalid row count: ${rows}`)
  }

  const path: number[] = []
  let slotIndex = 0

  for (let i = 0; i < rows; i++) {
    // 50% chance to go right (1), 50% to go left (0)
    const goRight = Math.random() >= 0.5 ? 1 : 0
    path.push(goRight)
    slotIndex += goRight
  }

  const multiplier = PLINKO_MULTIPLIERS[rows][slotIndex]

  return {
    path,
    slotIndex,
    multiplier
  }
}
