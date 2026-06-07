import { BoardTileFlavor, CornerVariant, SpaceType, TileEdge } from '@/features/game-board/game-board.enums';
import { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import { N, NW, W } from '@/shared/config/constants';

// Board spaces grouped by city/region per color: Kyiv-Podil (brown), Kyiv-Obolon (cyan),
// Kyiv-Solomyanka (pink), Kyiv-Pechersk (orange), Lviv (red),
// Odesa (yellow), Kharkiv (green), Kyiv landmarks (blue).
// Display names live in messages/{locale}.json under Board.tiles.p0..p39.
export const BOARD: BoardSpace[] = [
  { pos: 0,  type: SpaceType.CORNER,   corner: CornerVariant.GO },
  { pos: 1,  type: SpaceType.PROPERTY, price: 60,  color: PropertyColor.BROWN },
  { pos: 2,  type: SpaceType.CHEST },
  { pos: 3,  type: SpaceType.PROPERTY, price: 60,  color: PropertyColor.BROWN },
  { pos: 4,  type: SpaceType.TAX,      price: 200 },
  { pos: 5,  type: SpaceType.RAILROAD, price: 200 },
  { pos: 6,  type: SpaceType.PROPERTY, price: 100, color: PropertyColor.CYAN },
  { pos: 7,  type: SpaceType.CHANCE },
  { pos: 8,  type: SpaceType.PROPERTY, price: 100, color: PropertyColor.CYAN },
  { pos: 9,  type: SpaceType.PROPERTY, price: 120, color: PropertyColor.CYAN },
  { pos: 10, type: SpaceType.CORNER,   corner: CornerVariant.JAIL },
  { pos: 11, type: SpaceType.PROPERTY, price: 140, color: PropertyColor.PINK },
  { pos: 12, type: SpaceType.UTILITY,  price: 150 },
  { pos: 13, type: SpaceType.PROPERTY, price: 140, color: PropertyColor.PINK },
  { pos: 14, type: SpaceType.PROPERTY, price: 160, color: PropertyColor.PINK },
  { pos: 15, type: SpaceType.RAILROAD, price: 200 },
  { pos: 16, type: SpaceType.PROPERTY, price: 180, color: PropertyColor.ORANGE },
  { pos: 17, type: SpaceType.CHEST },
  { pos: 18, type: SpaceType.PROPERTY, price: 180, color: PropertyColor.ORANGE },
  { pos: 19, type: SpaceType.PROPERTY, price: 200, color: PropertyColor.ORANGE },
  { pos: 20, type: SpaceType.CORNER,   corner: CornerVariant.PARKING },
  { pos: 21, type: SpaceType.PROPERTY, price: 220, color: PropertyColor.RED },
  { pos: 22, type: SpaceType.CHANCE },
  { pos: 23, type: SpaceType.PROPERTY, price: 220, color: PropertyColor.RED },
  { pos: 24, type: SpaceType.PROPERTY, price: 240, color: PropertyColor.RED },
  { pos: 25, type: SpaceType.RAILROAD, price: 200 },
  { pos: 26, type: SpaceType.PROPERTY, price: 260, color: PropertyColor.YELLOW },
  { pos: 27, type: SpaceType.PROPERTY, price: 260, color: PropertyColor.YELLOW },
  { pos: 28, type: SpaceType.UTILITY,  price: 150 },
  { pos: 29, type: SpaceType.PROPERTY, price: 280, color: PropertyColor.YELLOW },
  { pos: 30, type: SpaceType.CORNER,   corner: CornerVariant.GOTO_JAIL },
  { pos: 31, type: SpaceType.PROPERTY, price: 300, color: PropertyColor.GREEN },
  { pos: 32, type: SpaceType.PROPERTY, price: 300, color: PropertyColor.GREEN },
  { pos: 33, type: SpaceType.CHEST },
  { pos: 34, type: SpaceType.PROPERTY, price: 320, color: PropertyColor.GREEN },
  { pos: 35, type: SpaceType.RAILROAD, price: 200 },
  { pos: 36, type: SpaceType.CHANCE },
  { pos: 37, type: SpaceType.PROPERTY, price: 350, color: PropertyColor.BLUE },
  { pos: 38, type: SpaceType.TAX,      price: 100 },
  { pos: 39, type: SpaceType.PROPERTY, price: 400, color: PropertyColor.BLUE },
];

export function getGridPos(pos: number): { col: number; row: number } {
  if (pos <= 10) return { col: 10 - pos, row: 10 };
  if (pos <= 20) return { col: 0, row: 20 - pos };
  if (pos <= 30) return { col: pos - 20, row: 0 };
  return { col: 10, row: pos - 30 };
}

export function getTileFlavor(type: SpaceType): BoardTileFlavor {
  switch (type) {
    case SpaceType.CORNER:
      return BoardTileFlavor.CORNER;
    case SpaceType.CHANCE:
    case SpaceType.CHEST:
      return BoardTileFlavor.SPECIAL;
    default:
      return BoardTileFlavor.PROPERTY;
  }
}

export function getTileEdge(pos: number): TileEdge {
  if (pos % 10 === 0) return TileEdge.CORNER;
  if (pos < 10)       return TileEdge.BOTTOM;
  if (pos < 20)       return TileEdge.LEFT;
  if (pos < 30)       return TileEdge.TOP;
  return TileEdge.RIGHT;
}

/** Returns each intermediate board position (inclusive of `to`, exclusive of `from`) walking clockwise. */
export function getWalkSteps(from: number, to: number): number[] {
  const steps: number[] = [];
  let cur = from;
  while (cur !== to) {
    cur = (cur + 1) % 40;
    steps.push(cur);
  }
  return steps;
}

const OUTER_MARGIN = 0.35; // grid units inward from the board's outer border

/** Returns the outer-edge position of a board tile as percentages of the 13-unit board grid.
 *  Used to place absolutely-positioned overlay tokens on the board perimeter. */
export function getTileOuterEdgePct(pos: number): { x: number; y: number } {
  const { col, row } = getGridPos(pos);

  const cx = col === 0 ? 1 : col === 10 ? 12 : col + 1.5;
  const cy = row === 0 ? 1 : row === 10 ? 12 : row + 1.5;

  const lo = OUTER_MARGIN;
  const hi = 13 - OUTER_MARGIN;

  let x: number;
  let y: number;

  if      (col === 10 && row === 10) { x = hi; y = hi; }
  else if (col === 0  && row === 10) { x = lo; y = hi; }
  else if (col === 0  && row === 0 ) { x = lo; y = lo; }
  else if (col === 10 && row === 0 ) { x = hi; y = lo; }
  else if (row === 10) { x = cx; y = hi; }
  else if (col === 0 ) { x = lo; y = cy; }
  else if (row === 0 ) { x = cx; y = lo; }
  else                 { x = hi; y = cy; }

  return { x: (x / 13) * 100, y: (y / 13) * 100 };
}

/** Returns the pixel center of a board tile in the unscaled 686px coordinate space. */
export function getTileCenter(pos: number): { x: number; y: number } {
  const { col, row } = getGridPos(pos);
  const colStart  = col === 0 ? 0 : col === 10 ? W + 9 * NW : W + (col - 1) * NW;
  const rowStart  = row === 0 ? 0 : row === 10 ? W + 9 * N  : W + (row - 1) * N;
  const colWidth  = col === 0 || col === 10 ? W : NW;
  const rowHeight = row === 0 || row === 10 ? W : N;
  return { x: colStart + colWidth / 2, y: rowStart + rowHeight / 2 };
}
