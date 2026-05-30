/**
 * Canonical per-position board economics — the single source of truth for price,
 * rent, building cost, mortgage value, and colour-group membership.
 *
 * Previously this data was duplicated across selectors/index.ts (RENT/PRICE/HOUSE_COST)
 * and deed.utils.ts (PROPERTY_RENT). Both now import from here.
 */

import { PropertyColor } from './game-state';

export const RAILROAD_POSITIONS = [5, 15, 25, 35] as const;
export const UTILITY_POSITIONS  = [12, 28] as const;

/** All positions that form each colour monopoly. */
export const COLOR_POSITIONS: Readonly<Record<PropertyColor, readonly number[]>> = {
  [PropertyColor.BROWN]:  [1, 3],
  [PropertyColor.CYAN]:   [6, 8, 9],
  [PropertyColor.PINK]:   [11, 13, 14],
  [PropertyColor.ORANGE]: [16, 18, 19],
  [PropertyColor.RED]:    [21, 23, 24],
  [PropertyColor.YELLOW]: [26, 27, 29],
  [PropertyColor.GREEN]:  [31, 32, 34],
  [PropertyColor.BLUE]:   [37, 39],
};

/** Colour-group for a position (inverse of COLOR_POSITIONS). */
export const POSITION_COLOR: Readonly<Partial<Record<number, PropertyColor>>> = Object.fromEntries(
  (Object.entries(COLOR_POSITIONS) as [PropertyColor, readonly number[]][]).flatMap(
    ([color, positions]) => positions.map((pos) => [pos, color]),
  ),
);

/** House/hotel build cost per colour group. */
export const HOUSE_COST: Readonly<Partial<Record<PropertyColor, number>>> = {
  [PropertyColor.BROWN]:  50,
  [PropertyColor.CYAN]:   50,
  [PropertyColor.PINK]:   100,
  [PropertyColor.ORANGE]: 100,
  [PropertyColor.RED]:    150,
  [PropertyColor.YELLOW]: 150,
  [PropertyColor.GREEN]:  200,
  [PropertyColor.BLUE]:   200,
};

/** Colour-property rent table: [base, monopoly, 1 house, 2, 3, 4, hotel]. */
export const RENT: Readonly<Record<number, readonly [number, number, number, number, number, number, number]>> = {
  1:  [2,   4,   10,  30,   90,   160,  250],
  3:  [4,   8,   20,  60,   180,  320,  450],
  6:  [6,   12,  30,  90,   270,  400,  550],
  8:  [6,   12,  30,  90,   270,  400,  550],
  9:  [8,   16,  40,  100,  300,  450,  600],
  11: [10,  20,  50,  150,  450,  625,  750],
  13: [10,  20,  50,  150,  450,  625,  750],
  14: [12,  24,  60,  180,  500,  700,  900],
  16: [14,  28,  70,  200,  550,  750,  950],
  18: [14,  28,  70,  200,  550,  750,  950],
  19: [16,  32,  80,  220,  600,  800,  1000],
  21: [18,  36,  90,  250,  700,  875,  1050],
  23: [18,  36,  90,  250,  700,  875,  1050],
  24: [20,  40,  100, 300,  750,  925,  1100],
  26: [22,  44,  110, 330,  800,  975,  1150],
  27: [22,  44,  110, 330,  800,  975,  1150],
  29: [24,  48,  120, 360,  850,  1025, 1200],
  31: [26,  52,  130, 390,  900,  1100, 1275],
  32: [26,  52,  130, 390,  900,  1100, 1275],
  34: [28,  56,  150, 450,  1000, 1200, 1400],
  37: [35,  70,  175, 500,  1100, 1300, 1500],
  39: [50,  100, 200, 600,  1400, 1700, 2000],
};

/** Purchase price per purchasable position (property + railroad + utility). */
export const PRICE: Readonly<Record<number, number>> = {
  1: 60,  3: 60,
  5: 200, 6: 100, 8: 100,  9: 120,
  11: 140, 12: 150, 13: 140, 14: 160, 15: 200,
  16: 180, 18: 180, 19: 200,
  21: 220, 23: 220, 24: 240, 25: 200,
  26: 260, 27: 260, 28: 150, 29: 280,
  31: 300, 32: 300, 34: 320, 35: 200,
  37: 350, 39: 400,
};

/** Mortgage value — half the purchase price. */
export function mortgageValue(position: number): number {
  return Math.floor((PRICE[position] ?? 0) / 2);
}

/** House/hotel build cost at a position (0 for railroads/utilities/non-property). */
export function buildingCost(position: number): number {
  const color = POSITION_COLOR[position];
  return color ? (HOUSE_COST[color] ?? 0) : 0;
}
