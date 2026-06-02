import type { GameState } from './game-state';
import type { AnimationInstruction } from './animation';

// ======================================================
// PLAYER PERMISSIONS
// Server-computed per viewer. The UI reflects this; it never recomputes it.
// ======================================================

export interface PlayerPermissions {
  readonly canRoll:        boolean;
  readonly canEndTurn:     boolean;

  readonly canBuyProperty: boolean;

  readonly canBuildHouse:  boolean;
  readonly canBuildHotel:  boolean;

  readonly canMortgage:    boolean;
  readonly canUnmortgage:  boolean;
  readonly canSellProperty: boolean;

  readonly canTrade:       boolean;

  readonly canBidAuction:  boolean;

  readonly canPayJailFine: boolean;
  readonly canUseJailCard: boolean;
  readonly canRollInJail:  boolean;

  readonly canPayDebt:           boolean;
  readonly canDeclareBankruptcy: boolean;
}

export const EMPTY_PERMISSIONS: PlayerPermissions = {
  canRoll:        false,
  canEndTurn:     false,
  canBuyProperty: false,
  canBuildHouse:  false,
  canBuildHotel:  false,
  canMortgage:    false,
  canUnmortgage:  false,
  canSellProperty: false,
  canTrade:       false,
  canBidAuction:  false,
  canPayJailFine: false,
  canUseJailCard: false,
  canRollInJail:  false,
  canPayDebt:           false,
  canDeclareBankruptcy: false,
};

// ======================================================
// GAME SNAPSHOT
// The unit the frontend stores and the mock server emits.
// ======================================================

export interface GameSnapshot {
  game:        GameState;
  permissions: PlayerPermissions;
  // Ordered animation instructions emitted by the backend describing how this state was
  // reached; replayed by the timeline-executor. Empty for reconnect/system frames.
  animationTimeline: AnimationInstruction[];
}
