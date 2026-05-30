import type { GameState } from './game-state';

// ======================================================
// PLAYER PERMISSIONS
// Server-computed per viewer. The UI reflects this; it never recomputes it.
// ======================================================

export type PlayerPermissions = {
  canRoll:        boolean;
  canEndTurn:     boolean;

  canBuyProperty: boolean;

  canBuildHouse:  boolean;
  canBuildHotel:  boolean;

  canMortgage:    boolean;
  canUnmortgage:  boolean;

  canTrade:       boolean;

  canBidAuction:  boolean;

  canPayJailFine: boolean;
  canUseJailCard: boolean;
  canRollInJail:  boolean;
};

export const EMPTY_PERMISSIONS: PlayerPermissions = {
  canRoll:        false,
  canEndTurn:     false,
  canBuyProperty: false,
  canBuildHouse:  false,
  canBuildHotel:  false,
  canMortgage:    false,
  canUnmortgage:  false,
  canTrade:       false,
  canBidAuction:  false,
  canPayJailFine: false,
  canUseJailCard: false,
  canRollInJail:  false,
};

// ======================================================
// GAME SNAPSHOT
// The unit the frontend stores and the mock server emits.
// ======================================================

export type GameSnapshot = {
  game:        GameState;
  permissions: PlayerPermissions;
};
