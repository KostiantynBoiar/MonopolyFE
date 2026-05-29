import { CornerVariant, PropertyColor, SpaceType, TileEdge } from '@/features/game-board/game-board.enums';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import { N, W } from '@/shared/config/constants';

export const BOARD: BoardSpace[] = [
  { pos: 0,  type: SpaceType.CORNER,   name: 'TYCOON',               corner: CornerVariant.GO },
  { pos: 1,  type: SpaceType.PROPERTY, name: 'Mediterranean Ave',    price: 60,  color: PropertyColor.BROWN },
  { pos: 2,  type: SpaceType.CHEST,    name: 'Community Chest' },
  { pos: 3,  type: SpaceType.PROPERTY, name: 'Baltic Ave',           price: 60,  color: PropertyColor.BROWN },
  { pos: 4,  type: SpaceType.TAX,      name: 'Income Tax',           price: 200 },
  { pos: 5,  type: SpaceType.RAILROAD, name: 'Reading Railroad',     price: 200 },
  { pos: 6,  type: SpaceType.PROPERTY, name: 'Oriental Ave',         price: 100, color: PropertyColor.CYAN },
  { pos: 7,  type: SpaceType.CHANCE,   name: 'Chance' },
  { pos: 8,  type: SpaceType.PROPERTY, name: 'Vermont Ave',          price: 100, color: PropertyColor.CYAN },
  { pos: 9,  type: SpaceType.PROPERTY, name: 'Connecticut Ave',      price: 120, color: PropertyColor.CYAN },
  { pos: 10, type: SpaceType.CORNER,   name: 'Just Visiting',        corner: CornerVariant.JAIL },
  { pos: 11, type: SpaceType.PROPERTY, name: 'St. Charles Place',    price: 140, color: PropertyColor.PINK },
  { pos: 12, type: SpaceType.UTILITY,  name: 'Electric Company',     price: 150 },
  { pos: 13, type: SpaceType.PROPERTY, name: 'States Ave',           price: 140, color: PropertyColor.PINK },
  { pos: 14, type: SpaceType.PROPERTY, name: 'Virginia Ave',         price: 160, color: PropertyColor.PINK },
  { pos: 15, type: SpaceType.RAILROAD, name: 'Pennsylvania Railroad', price: 200 },
  { pos: 16, type: SpaceType.PROPERTY, name: 'St. James Place',      price: 180, color: PropertyColor.ORANGE },
  { pos: 17, type: SpaceType.CHEST,    name: 'Community Chest' },
  { pos: 18, type: SpaceType.PROPERTY, name: 'Tennessee Ave',        price: 180, color: PropertyColor.ORANGE },
  { pos: 19, type: SpaceType.PROPERTY, name: 'New York Ave',         price: 200, color: PropertyColor.ORANGE },
  { pos: 20, type: SpaceType.CORNER,   name: 'Free Parking',         corner: CornerVariant.PARKING },
  { pos: 21, type: SpaceType.PROPERTY, name: 'Kentucky Ave',         price: 220, color: PropertyColor.RED },
  { pos: 22, type: SpaceType.CHANCE,   name: 'Chance' },
  { pos: 23, type: SpaceType.PROPERTY, name: 'Indiana Ave',          price: 220, color: PropertyColor.RED },
  { pos: 24, type: SpaceType.PROPERTY, name: 'Illinois Ave',         price: 240, color: PropertyColor.RED },
  { pos: 25, type: SpaceType.RAILROAD, name: 'B&O Railroad',         price: 200 },
  { pos: 26, type: SpaceType.PROPERTY, name: 'Atlantic Ave',         price: 260, color: PropertyColor.YELLOW },
  { pos: 27, type: SpaceType.PROPERTY, name: 'Ventnor Ave',          price: 260, color: PropertyColor.YELLOW },
  { pos: 28, type: SpaceType.UTILITY,  name: 'Water Works',          price: 150 },
  { pos: 29, type: SpaceType.PROPERTY, name: 'Marvin Gardens',       price: 280, color: PropertyColor.YELLOW },
  { pos: 30, type: SpaceType.CORNER,   name: 'Go to Jail',           corner: CornerVariant.GOTO_JAIL },
  { pos: 31, type: SpaceType.PROPERTY, name: 'Pacific Ave',          price: 300, color: PropertyColor.GREEN },
  { pos: 32, type: SpaceType.PROPERTY, name: 'North Carolina Ave',   price: 300, color: PropertyColor.GREEN },
  { pos: 33, type: SpaceType.CHEST,    name: 'Community Chest' },
  { pos: 34, type: SpaceType.PROPERTY, name: 'Pennsylvania Ave',     price: 320, color: PropertyColor.GREEN },
  { pos: 35, type: SpaceType.RAILROAD, name: 'Short Line Railroad',  price: 200 },
  { pos: 36, type: SpaceType.CHANCE,   name: 'Chance' },
  { pos: 37, type: SpaceType.PROPERTY, name: 'Park Place',           price: 350, color: PropertyColor.BLUE },
  { pos: 38, type: SpaceType.TAX,      name: 'Luxury Tax',           price: 100 },
  { pos: 39, type: SpaceType.PROPERTY, name: 'Boardwalk',            price: 400, color: PropertyColor.BLUE },
];

export function getGridPos(pos: number): { col: number; row: number } {
  if (pos <= 10) return { col: 10 - pos, row: 10 };
  if (pos <= 20) return { col: 0, row: 20 - pos };
  if (pos <= 30) return { col: pos - 20, row: 0 };
  return { col: 10, row: pos - 30 };
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

/** Returns the pixel center of a board tile in the unscaled 686px coordinate space. */
export function getTileCenter(pos: number): { x: number; y: number } {
  const { col, row } = getGridPos(pos);
  const colStart = col === 0 ? 0 : col === 10 ? W + 9 * N : W + (col - 1) * N;
  const rowStart = row === 0 ? 0 : row === 10 ? W + 9 * N : W + (row - 1) * N;
  const colWidth  = col === 0 || col === 10 ? W : N;
  const rowHeight = row === 0 || row === 10 ? W : N;
  return { x: colStart + colWidth / 2, y: rowStart + rowHeight / 2 };
}
