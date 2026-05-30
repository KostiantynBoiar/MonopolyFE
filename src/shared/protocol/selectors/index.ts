/**
 * Pure selectors over GameState.
 * All lookups are self-contained; no feature imports needed.
 * When the backend contract changes, update here — callers stay stable.
 */

import type { GameState, PlayerState, PropertyState } from '../game-state';
import { PropertyColor } from '../game-state';

// ── Static board data ─────────────────────────────────────────────────────────
// Rent table layout: [base, monopoly, 1h, 2h, 3h, 4h, hotel]

const RENT: Readonly<Record<number, readonly [number, number, number, number, number, number, number]>> = {
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

// Purchase price per position (purchasable spaces only)
const PRICE: Readonly<Record<number, number>> = {
  1: 60,  3: 60,
  5: 200, 6: 100, 8: 100,  9: 120,
  11: 140, 12: 150, 13: 140, 14: 160, 15: 200,
  16: 180, 18: 180, 19: 200,
  21: 220, 23: 220, 24: 240, 25: 200,
  26: 260, 27: 260, 28: 150, 29: 280,
  31: 300, 32: 300, 34: 320, 35: 200,
  37: 350, 39: 400,
};

// Sell-back cost per house/hotel by color group
const HOUSE_COST: Readonly<Partial<Record<PropertyColor, number>>> = {
  [PropertyColor.BROWN]:  50,
  [PropertyColor.CYAN]:   50,
  [PropertyColor.PINK]:   100,
  [PropertyColor.ORANGE]: 100,
  [PropertyColor.RED]:    150,
  [PropertyColor.YELLOW]: 150,
  [PropertyColor.GREEN]:  200,
  [PropertyColor.BLUE]:   200,
};

// All positions that form each color monopoly
const COLOR_POSITIONS: Readonly<Record<PropertyColor, readonly number[]>> = {
  [PropertyColor.BROWN]:  [1, 3],
  [PropertyColor.CYAN]:   [6, 8, 9],
  [PropertyColor.PINK]:   [11, 13, 14],
  [PropertyColor.ORANGE]: [16, 18, 19],
  [PropertyColor.RED]:    [21, 23, 24],
  [PropertyColor.YELLOW]: [26, 27, 29],
  [PropertyColor.GREEN]:  [31, 32, 34],
  [PropertyColor.BLUE]:   [37, 39],
};

// Property color by position (inverse of COLOR_POSITIONS)
const POSITION_COLOR: Readonly<Partial<Record<number, PropertyColor>>> = Object.fromEntries(
  (Object.entries(COLOR_POSITIONS) as [PropertyColor, readonly number[]][]).flatMap(
    ([color, positions]) => positions.map((pos) => [pos, color]),
  ),
);

const RAILROAD_POSITIONS = [5, 15, 25, 35] as const;
const UTILITY_POSITIONS  = [12, 28] as const;

// ── Minimal shape needed by property selectors ───────────────────────────────
// Using Pick instead of full GameState lets board components call these
// selectors with { spaces } alone — no need to thread the whole state.

type HasSpaces = Pick<GameState, 'spaces'>;

// ── Property access selectors ─────────────────────────────────────────────────
//
// All property lookups go through getProperty, which matches on the `position`
// FIELD rather than the array index. The protocol contract specifies a dense
// position-indexed array, but matching on the field keeps these selectors correct
// even if the backend ever sends a sparse, filtered, or reordered spaces array —
// the failure mode (silently returning the wrong space) is eliminated at the root.

/** PropertyState at board `position`, or null if no space carries that position. */
export function getProperty(state: HasSpaces, position: number): PropertyState | null {
  return state.spaces.find((s) => s.position === position) ?? null;
}

/**
 * Owner ID at `position`, or null if the space is unowned or non-purchasable.
 * Prefer this over `space.ownerId` — the name communicates intent.
 */
export function getOwner(state: HasSpaces, position: number): string | null {
  return getProperty(state, position)?.ownerId ?? null;
}

/**
 * True when the space at `position` is mortgaged.
 * Mortgaged properties collect no rent.
 */
export function isMortgaged(state: HasSpaces, position: number): boolean {
  return getProperty(state, position)?.isMortgaged ?? false;
}

// ── Player selectors ──────────────────────────────────────────────────────────

export function getPlayer(state: GameState, id: string): PlayerState | null {
  return state.players.find((p) => p.id === id) ?? null;
}

export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.isBankrupt);
}

// ── Property selectors ────────────────────────────────────────────────────────

/** All spaces owned by a player, derived from state.spaces. */
export function getPlayerProperties(state: GameState, playerId: string): PropertyState[] {
  return state.spaces.filter((s) => s.ownerId === playerId);
}

/** All board positions owned by a player. Convenience wrapper. */
export function getPlayerPositions(state: GameState, playerId: string): number[] {
  return getPlayerProperties(state, playerId).map((s) => s.position);
}

/** True if the player owns every property of the given color. */
export function hasMonopoly(state: GameState, playerId: string, color: PropertyColor): boolean {
  const positions = COLOR_POSITIONS[color];
  return positions.every((pos) => getOwner(state, pos) === playerId);
}

/**
 * Current rent owed when landing on `position`.
 * Returns 0 for unowned, mortgaged, or non-purchasable spaces.
 * For utilities, returns the dice-roll multiplier (4 or 10); multiply by the dice sum at the call site.
 */
export function getPropertyRent(state: GameState, position: number): number {
  const space = getProperty(state, position);
  if (!space || space.ownerId === null || space.isMortgaged) return 0;

  if ((RAILROAD_POSITIONS as readonly number[]).includes(position)) {
    const owned = RAILROAD_POSITIONS.filter(
      (p) => getOwner(state, p) === space.ownerId,
    ).length;
    return 25 * Math.pow(2, owned - 1);
  }

  if ((UTILITY_POSITIONS as readonly number[]).includes(position)) {
    const owned = UTILITY_POSITIONS.filter(
      (p) => getOwner(state, p) === space.ownerId,
    ).length;
    return owned === 2 ? 10 : 4; // multiplier — caller multiplies by dice roll
  }

  const rentRow = RENT[position];
  if (!rentRow) return 0;

  if (space.hotel) return rentRow[6];
  if (space.houses > 0) return rentRow[space.houses + 1]; // 1h→[2], 2h→[3], 3h→[4], 4h→[5]

  const color = POSITION_COLOR[position];
  if (color && hasMonopoly(state, space.ownerId, color)) return rentRow[1];

  return rentRow[0];
}

/** Net worth: cash + unmortgaged property prices + half of building costs (liquidation value). */
export function getPlayerNetWorth(state: GameState, playerId: string): number {
  const player = getPlayer(state, playerId);
  if (!player) return 0;

  let worth = player.balance;

  for (const space of getPlayerProperties(state, playerId)) {
    const price = PRICE[space.position] ?? 0;
    worth += space.isMortgaged ? Math.floor(price / 2) : price;

    if (!space.isMortgaged && (space.houses > 0 || space.hotel)) {
      const color = POSITION_COLOR[space.position];
      const houseCost = color ? (HOUSE_COST[color] ?? 0) : 0;
      const buildingCount = space.hotel ? 5 : space.houses;
      worth += Math.floor((houseCost * buildingCount) / 2);
    }
  }

  return worth;
}
