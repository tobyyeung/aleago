const HOUSE_EDGE = 0.01; // 1% house edge
const GRID_SIZE = 25;

export type Tile = {
  id: number;
  isMine: boolean;
  revealed: boolean;
};

/**
 * Calculates the multiplier for the current number of safe picks.
 */
export function getMinesMultiplier(minesCount: number, safePicks: number): number {
  if (safePicks === 0) return 1.0;
  if (safePicks + minesCount > GRID_SIZE) return 0; // Invalid state

  let probability = 1.0;
  for (let i = 0; i < safePicks; i++) {
    const remainingTiles = GRID_SIZE - i;
    const remainingSafe = remainingTiles - minesCount;
    probability *= remainingSafe / remainingTiles;
  }

  const multiplier = (1 - HOUSE_EDGE) / probability;
  // Floor to 2 decimal places to avoid floating point weirdness and ensure house keeps its edge
  return Math.floor(multiplier * 100) / 100;
}

/**
 * Generates a new grid of 25 tiles with the specified number of mines placed randomly.
 */
export function generateMinesGrid(minesCount: number): Tile[] {
  const grid: Tile[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
    id: i,
    isMine: false,
    revealed: false,
  }));

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const randomIndex = Math.floor(Math.random() * GRID_SIZE);
    if (!grid[randomIndex].isMine) {
      grid[randomIndex].isMine = true;
      minesPlaced++;
    }
  }

  return grid;
}
