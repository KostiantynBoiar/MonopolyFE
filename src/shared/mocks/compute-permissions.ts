/**
 * Mock permission engine.
 *
 * In production the backend computes PlayerPermissions and sends them in every
 * Snapshot. Here we derive them client-side from the factual GameState so the
 * mock pipeline stays self-consistent.
 *
 * Rules are intentionally simplified — the real backend is authoritative.
 * The frontend NEVER calls this function; only the mock server does.
 */

import type { GameState } from '@/shared/protocol/game-state';
import { TurnPhase } from '@/shared/protocol/game-state';
import type { PlayerPermissions } from '@/shared/protocol/permissions';
import { EMPTY_PERMISSIONS } from '@/shared/protocol/permissions';
import { getPlayerProperties } from '@/shared/protocol/selectors';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';

const PURCHASABLE: Set<string> = new Set([
  SpaceType.PROPERTY, SpaceType.RAILROAD, SpaceType.UTILITY,
]);

export function computePermissions(state: GameState): PlayerPermissions {
  const viewer   = state.players.find((p) => p.id === state.viewerId);
  if (!viewer || viewer.isBankrupt) return EMPTY_PERMISSIONS;

  const isViewerTurn = state.turn.currentPlayerId === state.viewerId;
  const phase        = state.turn.phase;
  const inJail       = viewer.jailStatus !== null;

  // ── canBuyProperty ────────────────────────────────────────────────────────
  // True when the viewer is standing on a space they can purchase right now.
  const landedSpace   = BOARD[viewer.position];
  const isPurchasable = landedSpace != null && PURCHASABLE.has(landedSpace.type);
  const isUnowned     = state.spaces[viewer.position]?.ownerId === null;
  const canBuyProperty =
    isViewerTurn && phase === TurnPhase.POST_ROLL && isPurchasable && isUnowned;

  // ── canBuild ──────────────────────────────────────────────────────────────
  // Simplified: viewer's turn + post_roll; server validates monopoly + housing limits.
  const viewerProps    = getPlayerProperties(state, state.viewerId);
  const hasProperties  = viewerProps.length > 0;
  const canBuildHouse  = isViewerTurn && phase === TurnPhase.POST_ROLL && hasProperties;
  const canBuildHotel  = isViewerTurn && phase === TurnPhase.POST_ROLL &&
    viewerProps.some((s) => s.houses === 4);

  // ── canMortgage / canUnmortgage ────────────────────────────────────────────
  const canMortgage   = isViewerTurn && viewerProps.some((s) => !s.isMortgaged && s.houses === 0 && !s.hotel);
  const canUnmortgage = isViewerTurn && viewerProps.some((s) => s.isMortgaged);

  // ── canTrade ──────────────────────────────────────────────────────────────
  const canTrade = isViewerTurn && (phase === TurnPhase.POST_ROLL || phase === TurnPhase.PRE_ROLL);

  return {
    canRoll:        isViewerTurn && phase === TurnPhase.PRE_ROLL && !inJail,
    canEndTurn:     isViewerTurn && phase === TurnPhase.POST_ROLL,

    canBuyProperty,

    canBuildHouse,
    canBuildHotel,

    canMortgage,
    canUnmortgage,

    canTrade,

    canBidAuction:  phase === TurnPhase.AUCTION && !viewer.isBankrupt,

    canPayJailFine: isViewerTurn && phase === TurnPhase.JAIL_DECISION &&
      inJail && viewer.balance >= 50,

    canUseJailCard: isViewerTurn && phase === TurnPhase.JAIL_DECISION &&
      inJail && viewer.getOutOfJailCards > 0,
  };
}
