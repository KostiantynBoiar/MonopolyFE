import { BoardTileFlavor, CornerVariant, SpaceType, TileEdge } from '@/features/game-board/game-board.enums';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { getBoardData } from '@/shared/protocol/board-data';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import { N, NW, W } from '@/shared/config/constants';

// ─── BoardConfig ──────────────────────────────────────────────────────────────

export interface BoardConfig {
  readonly gameMode: GameMode;
  /** Ordered traversal positions (clockwise from startPosition). */
  readonly positions: readonly number[];
  readonly spaces: readonly BoardSpace[];
  /** O(1) lookup: position → BoardSpace. */
  readonly spacesByPosition: Readonly<Record<number, BoardSpace>>;
  /** O(1) lookup: position → index in positions[]. */
  readonly positionIndexByPosition: Readonly<Record<number, number>>;
  readonly startPosition: number;
  readonly jailPosition: number;
  readonly goToJailPosition: number;
  readonly diceCount: 1 | 2;
  /** CSS grid col/row (0-indexed) for each position on the desktop board. */
  readonly gridByPosition: Readonly<Record<number, { col: number; row: number }>>;
  readonly gridTemplateCols: string;
  readonly gridTemplateRows: string;
  /** Center area CSS (1-indexed, exclusive end): the inner board region for dice/actions/chat. */
  readonly centerGridArea: { colStart: number; colEnd: number; rowStart: number; rowEnd: number };
}

function buildConfig(
  gameMode: GameMode,
  spaces: BoardSpace[],
  startPosition: number,
  jailPosition: number,
  goToJailPosition: number,
  diceCount: 1 | 2,
  gridByPosition: Record<number, { col: number; row: number }>,
  gridTemplateCols: string,
  gridTemplateRows: string,
  centerGridArea: { colStart: number; colEnd: number; rowStart: number; rowEnd: number },
): BoardConfig {
  const positionIndexByPosition: Record<number, number> = {};
  const spacesByPosition: Record<number, BoardSpace> = {};
  for (const s of spaces) spacesByPosition[s.pos] = s;

  // Build ordered positions starting from startPosition, going by grid traversal order.
  // Spaces are already in traversal order in the input array.
  const positions = spaces.map((s) => s.pos);
  positions.forEach((p, i) => { positionIndexByPosition[p] = i; });

  return {
    gameMode,
    positions,
    spaces,
    spacesByPosition,
    positionIndexByPosition,
    startPosition,
    jailPosition,
    goToJailPosition,
    diceCount,
    gridByPosition,
    gridTemplateCols,
    gridTemplateRows,
    centerGridArea,
  };
}

const NORMAL_CORNERS: Record<number, CornerVariant> = {
   1: CornerVariant.GO,
  11: CornerVariant.JAIL,
  21: CornerVariant.PARKING,
  31: CornerVariant.GOTO_JAIL,
};

const DUEL_CORNERS: Record<number, CornerVariant> = {
   1: CornerVariant.GO,
   7: CornerVariant.JAIL,
  13: CornerVariant.PARKING,
  19: CornerVariant.GOTO_JAIL,
};

function buildSpaces(count: number, corners: Record<number, CornerVariant>, gameMode: GameMode): BoardSpace[] {
  const data = getBoardData(gameMode);
  const railroadSet = new Set(data.railroadPositions);
  const utilitySet  = new Set(data.utilityPositions);
  const chanceSet   = new Set(data.chancePositions);
  const chestSet    = new Set(data.chestPositions);
  return Array.from({ length: count }, (_, i) => {
    const pos = i + 1;
    if (pos in corners)            return { pos, type: SpaceType.CORNER,   corner: corners[pos] };
    if (chanceSet.has(pos))        return { pos, type: SpaceType.CHANCE };
    if (chestSet.has(pos))         return { pos, type: SpaceType.CHEST };
    if (pos in data.taxAmounts)    return { pos, type: SpaceType.TAX,      price: data.taxAmounts[pos] };
    if (railroadSet.has(pos))      return { pos, type: SpaceType.RAILROAD, price: data.price[pos] };
    if (utilitySet.has(pos))       return { pos, type: SpaceType.UTILITY,  price: data.price[pos] };
    const color = data.positionColor[pos];
    if (color)                     return { pos, type: SpaceType.PROPERTY, price: data.price[pos], color };
    throw new Error(`buildSpaces: no rule for position ${pos} on ${gameMode} board`);
  });
}

const NORMAL_SPACES: BoardSpace[] = buildSpaces(40, NORMAL_CORNERS, GameMode.NORMAL);

/** Normal board grid position (0-indexed col/row in the 11×11 desktop grid). */
function normalGridPos(pos: number): { col: number; row: number } {
  if (pos <= 11) return { col: 11 - pos, row: 10 };
  if (pos <= 21) return { col: 0,        row: 21 - pos };
  if (pos <= 31) return { col: pos - 21, row: 0 };
  return { col: 10, row: pos - 31 };
}

const NORMAL_GRID = Object.fromEntries(
  NORMAL_SPACES.map((s) => [s.pos, normalGridPos(s.pos)]),
) as Record<number, { col: number; row: number }>;

export const NORMAL_BOARD_CONFIG: BoardConfig = buildConfig(
  GameMode.NORMAL,
  NORMAL_SPACES,
  1,   // GO
  11,  // JAIL
  31,  // GO-TO-JAIL
  2,
  NORMAL_GRID,
  `calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)`,
  `calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)`,
  { colStart: 2, colEnd: 11, rowStart: 2, rowEnd: 11 },
);

// ─── Duel board (positions 1–24) ─────────────────────────────────────────────
// Compact 2-player board. Arranged as a full square perimeter on a 7×7 grid (0-indexed).
// Corners: GO(1), JAIL(7), PARKING(13), GOTO_JAIL(19). 5 non-corner tiles per side.
// Display names in messages/{locale}.json under Board.tiles.duel.p1..p24.
//
// Grid layout (col, row):
//   Bottom row  y=6: pos  1(6,6) 2(5,6) 3(4,6) 4(3,6) 5(2,6) 6(1,6) 7(0,6)
//   Left col    x=0: pos  8(0,5) 9(0,4) 10(0,3) 11(0,2) 12(0,1) 13(0,0)←corner
//   Top row     y=0: pos 14(1,0) 15(2,0) 16(3,0) 17(4,0) 18(5,0) 19(6,0)←corner
//   Right col   x=6: pos 20(6,1) 21(6,2) 22(6,3) 23(6,4) 24(6,5)

const DUEL_SPACES: BoardSpace[] = buildSpaces(24, DUEL_CORNERS, GameMode.DUEL);

const DUEL_GRID_COORDS: Record<number, { col: number; row: number }> = {
   1: { col: 6, row: 6 },  // GO corner
   2: { col: 5, row: 6 },
   3: { col: 4, row: 6 },
   4: { col: 3, row: 6 },
   5: { col: 2, row: 6 },
   6: { col: 1, row: 6 },
   7: { col: 0, row: 6 },  // JAIL corner
   8: { col: 0, row: 5 },
   9: { col: 0, row: 4 },
  10: { col: 0, row: 3 },
  11: { col: 0, row: 2 },
  12: { col: 0, row: 1 },
  13: { col: 0, row: 0 },  // PARKING corner
  14: { col: 1, row: 0 },
  15: { col: 2, row: 0 },
  16: { col: 3, row: 0 },
  17: { col: 4, row: 0 },
  18: { col: 5, row: 0 },
  19: { col: 6, row: 0 },  // GOTO_JAIL corner
  20: { col: 6, row: 1 },
  21: { col: 6, row: 2 },
  22: { col: 6, row: 3 },
  23: { col: 6, row: 4 },
  24: { col: 6, row: 5 },
};

export const DUEL_BOARD_CONFIG: BoardConfig = buildConfig(
  GameMode.DUEL,
  DUEL_SPACES,
  1,   // GO
  7,   // JAIL
  19,  // GOTO_JAIL
  1,
  DUEL_GRID_COORDS,
  'repeat(7, 1fr)',
  'repeat(7, 1fr)',
  { colStart: 2, colEnd: 7, rowStart: 2, rowEnd: 7 },
);

// ─── Public API ───────────────────────────────────────────────────────────────

export function getBoardConfig(gameMode: GameMode): BoardConfig {
  return gameMode === GameMode.DUEL ? DUEL_BOARD_CONFIG : NORMAL_BOARD_CONFIG;
}

/** Walk positions from `from` (exclusive) to `to` (inclusive) along config traversal order. */
export function getWalkSteps(from: number, to: number, config: BoardConfig): number[] {
  const { positions, positionIndexByPosition } = config;
  const steps: number[] = [];
  let idx = positionIndexByPosition[from] ?? 0;
  while (positions[idx] !== to) {
    idx = (idx + 1) % positions.length;
    steps.push(positions[idx]);
  }
  return steps;
}

/** Walk positions backward from `from` to `to` along config traversal order. */
export function getBackwardWalkSteps(from: number, to: number, config: BoardConfig): number[] {
  const { positions, positionIndexByPosition } = config;
  const steps: number[] = [];
  let idx = positionIndexByPosition[from] ?? 0;
  while (positions[idx] !== to) {
    idx = (idx - 1 + positions.length) % positions.length;
    steps.push(positions[idx]);
  }
  return steps;
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

export function getNormalTileEdge(pos: number): TileEdge {
  if (pos === 1 || pos === 11 || pos === 21 || pos === 31) return TileEdge.CORNER;
  if (pos < 11) return TileEdge.BOTTOM;
  if (pos < 21) return TileEdge.LEFT;
  if (pos < 31) return TileEdge.TOP;
  return TileEdge.RIGHT;
}

export function getDuelTileEdge(pos: number): TileEdge {
  const g = DUEL_GRID_COORDS[pos];
  if (!g) return TileEdge.BOTTOM;
  if ((g.col === 0 || g.col === 6) && (g.row === 0 || g.row === 6)) return TileEdge.CORNER;
  if (g.row === 6) return TileEdge.BOTTOM;
  if (g.col === 0) return TileEdge.LEFT;
  if (g.row === 0) return TileEdge.TOP;
  return TileEdge.RIGHT;
}

export function getTileEdge(pos: number, config: BoardConfig): TileEdge {
  return config.gameMode === GameMode.DUEL ? getDuelTileEdge(pos) : getNormalTileEdge(pos);
}

/** Outer-edge percentage position of a tile within the board viewport (for overlay tokens). */
export function getTileOuterEdgePct(pos: number, config: BoardConfig): { x: number; y: number } {
  const g = config.gridByPosition[pos];
  if (!g) return { x: 50, y: 50 };

  if (config.gameMode === GameMode.DUEL) {
    const GRID_SIZE = 7;
    const raw_x = (g.col + 0.5) / GRID_SIZE * 100;
    const raw_y = (g.row + 0.5) / GRID_SIZE * 100;
    // Nudge tokens toward their tile's outer edge for visual clarity
    const edge = getDuelTileEdge(pos);
    const nudge = 4;
    switch (edge) {
      case TileEdge.BOTTOM:  return { x: raw_x, y: raw_y + nudge };
      case TileEdge.LEFT:    return { x: raw_x - nudge, y: raw_y };
      case TileEdge.TOP:     return { x: raw_x, y: raw_y - nudge };
      case TileEdge.RIGHT:   return { x: raw_x + nudge, y: raw_y };
      default:               return { x: raw_x, y: raw_y };
    }
  }

  // Normal board: 11×11 grid with 2-unit corners in a 13-unit viewport
  const { col, row } = g;
  const OUTER_MARGIN = 0.35;
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

/** Pixel center of a normal-board tile in the unscaled 686px coordinate space. */
export function getTileCenter(pos: number): { x: number; y: number } {
  const { col, row } = normalGridPos(pos);
  const colStart  = col === 0 ? 0 : col === 10 ? W + 9 * NW : W + (col - 1) * NW;
  const rowStart  = row === 0 ? 0 : row === 10 ? W + 9 * N  : W + (row - 1) * N;
  const colWidth  = col === 0 || col === 10 ? W : NW;
  const rowHeight = row === 0 || row === 10 ? W : N;
  return { x: colStart + colWidth / 2, y: rowStart + rowHeight / 2 };
}