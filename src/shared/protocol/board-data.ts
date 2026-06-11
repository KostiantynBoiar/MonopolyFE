/**
 * Canonical per-position board economics — the single source of truth for price,
 * rent, building cost, mortgage value, and colour-group membership.
 *
 * Normal board: positions 1..40 (1-based, aligning with backend).
 * Duel board:   positions 1..23.
 *
 * Use getBoardData(gameMode) to select the appropriate table.
 */

import { GameMode, PropertyColor } from './game-state.enums';

// ─── Normal board economics (positions 1..40) ─────────────────────────────────

export const NORMAL_RAILROAD_POSITIONS = [6, 16, 26, 36] as const;
export const NORMAL_UTILITY_POSITIONS  = [13, 29] as const;

export const NORMAL_COLOR_POSITIONS: Readonly<Record<PropertyColor, readonly number[]>> = {
  [PropertyColor.BROWN]:  [2, 4],
  [PropertyColor.CYAN]:   [7, 9, 10],
  [PropertyColor.PINK]:   [12, 14, 15],
  [PropertyColor.ORANGE]: [17, 19, 20],
  [PropertyColor.RED]:    [22, 24, 25],
  [PropertyColor.YELLOW]: [27, 28, 30],
  [PropertyColor.GREEN]:  [32, 33, 35],
  [PropertyColor.BLUE]:   [38, 40],
};

export const NORMAL_POSITION_COLOR: Readonly<Partial<Record<number, PropertyColor>>> = Object.fromEntries(
  (Object.entries(NORMAL_COLOR_POSITIONS) as [PropertyColor, readonly number[]][]).flatMap(
    ([color, positions]) => positions.map((pos) => [pos, color]),
  ),
);

export const NORMAL_HOUSE_COST: Readonly<Partial<Record<PropertyColor, number>>> = {
  [PropertyColor.BROWN]:  50,
  [PropertyColor.CYAN]:   50,
  [PropertyColor.PINK]:   100,
  [PropertyColor.ORANGE]: 100,
  [PropertyColor.RED]:    150,
  [PropertyColor.YELLOW]: 150,
  [PropertyColor.GREEN]:  200,
  [PropertyColor.BLUE]:   200,
};

export const NORMAL_RENT: Readonly<Record<number, readonly [number, number, number, number, number, number, number]>> = {
  2:  [2,   4,   10,  30,   90,   160,  250],
  4:  [4,   8,   20,  60,   180,  320,  450],
  7:  [6,   12,  30,  90,   270,  400,  550],
  9:  [6,   12,  30,  90,   270,  400,  550],
  10: [8,   16,  40,  100,  300,  450,  600],
  12: [10,  20,  50,  150,  450,  625,  750],
  14: [10,  20,  50,  150,  450,  625,  750],
  15: [12,  24,  60,  180,  500,  700,  900],
  17: [14,  28,  70,  200,  550,  750,  950],
  19: [14,  28,  70,  200,  550,  750,  950],
  20: [16,  32,  80,  220,  600,  800,  1000],
  22: [18,  36,  90,  250,  700,  875,  1050],
  24: [18,  36,  90,  250,  700,  875,  1050],
  25: [20,  40,  100, 300,  750,  925,  1100],
  27: [22,  44,  110, 330,  800,  975,  1150],
  28: [22,  44,  110, 330,  800,  975,  1150],
  30: [24,  48,  120, 360,  850,  1025, 1200],
  32: [26,  52,  130, 390,  900,  1100, 1275],
  33: [26,  52,  130, 390,  900,  1100, 1275],
  35: [28,  56,  150, 450,  1000, 1200, 1400],
  38: [35,  70,  175, 500,  1100, 1300, 1500],
  40: [50,  100, 200, 600,  1400, 1700, 2000],
};

export const NORMAL_PRICE: Readonly<Record<number, number>> = {
  2:  60,  4:  60,
  6:  200, 7:  100, 9:  100, 10: 120,
  12: 140, 13: 150, 14: 140, 15: 160, 16: 200,
  17: 180,          19: 180, 20: 200,
  22: 220,          24: 220, 25: 240, 26: 200,
  27: 260, 28: 260, 29: 150, 30: 280,
  32: 300, 33: 300,           35: 320, 36: 200,
  38: 350,           40: 400,
};

// ─── Duel board economics (positions 1..23) ───────────────────────────────────
// YELLOW/GREEN/BLUE each have one property — owning it equals an instant monopoly.

export const DUEL_RAILROAD_POSITIONS = [5] as const;
export const DUEL_UTILITY_POSITIONS  = [10] as const;

export const DUEL_COLOR_POSITIONS: Readonly<Record<PropertyColor, readonly number[]>> = {
  [PropertyColor.BROWN]:  [2, 4],
  [PropertyColor.CYAN]:   [6, 8],
  [PropertyColor.PINK]:   [9, 11],
  [PropertyColor.ORANGE]: [14, 15],
  [PropertyColor.RED]:    [17, 19],
  [PropertyColor.YELLOW]: [20],
  [PropertyColor.GREEN]:  [22],
  [PropertyColor.BLUE]:   [23, 24],
};

export const DUEL_POSITION_COLOR: Readonly<Partial<Record<number, PropertyColor>>> = Object.fromEntries(
  (Object.entries(DUEL_COLOR_POSITIONS) as [PropertyColor, readonly number[]][]).flatMap(
    ([color, positions]) => positions.map((pos) => [pos, color]),
  ),
);

export const DUEL_HOUSE_COST: Readonly<Partial<Record<PropertyColor, number>>> = {
  [PropertyColor.BROWN]:  50,
  [PropertyColor.CYAN]:   50,
  [PropertyColor.PINK]:   100,
  [PropertyColor.ORANGE]: 100,
  [PropertyColor.RED]:    150,
  [PropertyColor.YELLOW]: 150,
  [PropertyColor.GREEN]:  200,
  [PropertyColor.BLUE]:   200,
};

export const DUEL_RENT: Readonly<Record<number, readonly [number, number, number, number, number, number, number]>> = {
  2:  [2,   4,   10,  30,   90,   160,  250],
  4:  [4,   8,   20,  60,   180,  320,  450],
  6:  [6,   12,  30,  90,   270,  400,  550],
  8:  [6,   12,  30,  90,   270,  400,  550],
  9:  [10,  20,  50,  150,  450,  625,  750],
  11: [10,  20,  50,  150,  450,  625,  750],
  14: [14,  28,  70,  200,  550,  750,  950],
  15: [16,  32,  80,  220,  600,  800,  1000],
  17: [18,  36,  90,  250,  700,  875,  1050],
  19: [20,  40,  100, 300,  750,  925,  1100],
  20: [22,  44,  110, 330,  800,  975,  1150],
  22: [26,  52,  130, 390,  900,  1100, 1275],
  23: [50,  100, 200, 600,  1400, 1700, 2000],
  24: [70,  140, 300, 900,  2000, 2200, 2500],
};

export const DUEL_PRICE: Readonly<Record<number, number>> = {
  2:  60,  4:  60,
  5:  200, 6:  100, 8:  100,
  9:  140, 10: 150, 11: 140,
  14: 180, 15: 200,
  17: 220,           19: 240,
  20: 260, 22: 300, 23: 400, 24: 450,
};

// ─── BoardData bundle ──────────────────────────────────────────────────────────

export interface BoardData {
  readonly railroadPositions: readonly number[];
  readonly utilityPositions:  readonly number[];
  readonly colorPositions:    Readonly<Record<PropertyColor, readonly number[]>>;
  readonly positionColor:     Readonly<Partial<Record<number, PropertyColor>>>;
  readonly houseCost:         Readonly<Partial<Record<PropertyColor, number>>>;
  readonly rent:              Readonly<Record<number, readonly [number, number, number, number, number, number, number]>>;
  readonly price:             Readonly<Record<number, number>>;
}

const NORMAL_BOARD_DATA: BoardData = {
  railroadPositions: NORMAL_RAILROAD_POSITIONS,
  utilityPositions:  NORMAL_UTILITY_POSITIONS,
  colorPositions:    NORMAL_COLOR_POSITIONS,
  positionColor:     NORMAL_POSITION_COLOR,
  houseCost:         NORMAL_HOUSE_COST,
  rent:              NORMAL_RENT,
  price:             NORMAL_PRICE,
};

const DUEL_BOARD_DATA: BoardData = {
  railroadPositions: DUEL_RAILROAD_POSITIONS,
  utilityPositions:  DUEL_UTILITY_POSITIONS,
  colorPositions:    DUEL_COLOR_POSITIONS,
  positionColor:     DUEL_POSITION_COLOR,
  houseCost:         DUEL_HOUSE_COST,
  rent:              DUEL_RENT,
  price:             DUEL_PRICE,
};

export function getBoardData(gameMode: GameMode): BoardData {
  return gameMode === GameMode.DUEL ? DUEL_BOARD_DATA : NORMAL_BOARD_DATA;
}

/** Mortgage value — half the purchase price. */
export function mortgageValue(position: number, gameMode: GameMode = GameMode.NORMAL): number {
  return Math.floor((getBoardData(gameMode).price[position] ?? 0) / 2);
}

/** House/hotel build cost at a position (0 for railroads/utilities/non-property). */
export function buildingCost(position: number, gameMode: GameMode = GameMode.NORMAL): number {
  const { positionColor, houseCost } = getBoardData(gameMode);
  const color = positionColor[position];
  return color ? (houseCost[color] ?? 0) : 0;
}