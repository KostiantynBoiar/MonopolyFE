/**
 * Pure selectors over GameState.
 * All lookups are self-contained; no feature imports needed.
 * When the backend contract changes, update here — callers stay stable.
 */

import type { GameState, PlayerState, PropertyState } from '../game-state';
import { PropertyColor } from '../game-state.enums';
import {
  RENT, PRICE, HOUSE_COST, COLOR_POSITIONS, POSITION_COLOR,
  RAILROAD_POSITIONS, UTILITY_POSITIONS,
} from '../board-data';

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
