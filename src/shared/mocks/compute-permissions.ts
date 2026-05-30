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
import { getPlayerProperties, getProperty, hasMonopoly } from '@/shared/protocol/selectors';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';

const PURCHASABLE: Set<string> = new Set([
  SpaceType.PROPERTY, SpaceType.RAILROAD, SpaceType.UTILITY,
]);

// Only color-group properties can have houses/hotels built on them.
// Railroads and utilities are excluded even though they are purchasable.
const COLOR_GROUP_ONLY: Set<string> = new Set([SpaceType.PROPERTY]);

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
  const isUnowned     = getProperty(state, viewer.position)?.ownerId === null;
  const canBuyProperty =
    isViewerTurn && phase === TurnPhase.POST_ROLL && isPurchasable && isUnowned;

  // ── canBuild ──────────────────────────────────────────────────────────────
  // You may build any time during your own turn (pre- or post-roll), but only on a
  // completed colour monopoly. Railroads/utilities never take houses.
  const viewerProps     = getPlayerProperties(state, state.viewerId);
  const canBuildPhase   = isViewerTurn && (phase === TurnPhase.PRE_ROLL || phase === TurnPhase.POST_ROLL);
  const inMonopoly = (s: { position: number }) => {
    const color = BOARD[s.position]?.color;
    return !!color && COLOR_GROUP_ONLY.has(BOARD[s.position]?.type ?? '') && hasMonopoly(state, state.viewerId, color);
  };
  const canBuildHouse  = canBuildPhase &&
    viewerProps.some((s) => inMonopoly(s) && !s.hotel && s.houses < 4);
  const canBuildHotel  = canBuildPhase &&
    viewerProps.some((s) => inMonopoly(s) && s.houses === 4);

  // ── canMortgage / canUnmortgage / canSellProperty ──────────────────────────
  const canMortgage   = isViewerTurn && viewerProps.some((s) => !s.isMortgaged && s.houses === 0 && !s.hotel);
  const canUnmortgage = isViewerTurn && viewerProps.some((s) => s.isMortgaged);
  const canSellProperty = isViewerTurn && viewerProps.some((s) => !s.hotel && s.houses === 0);

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
    canSellProperty,

    canTrade,

    canBidAuction:  phase === TurnPhase.AUCTION && !viewer.isBankrupt,

    canPayJailFine: isViewerTurn && phase === TurnPhase.JAIL_DECISION &&
      inJail && viewer.balance >= 50,

    canUseJailCard: isViewerTurn && phase === TurnPhase.JAIL_DECISION &&
      inJail && viewer.getOutOfJailCards > 0,

    canRollInJail:  isViewerTurn && phase === TurnPhase.JAIL_DECISION && inJail,

    canPayDebt: phase === TurnPhase.MUST_PAY_RENT &&
      state.debt?.debtorId === state.viewerId && viewer.balance >= state.debt.amount,

    canDeclareBankruptcy: phase === TurnPhase.MUST_PAY_RENT &&
      state.debt?.debtorId === state.viewerId,
  };
}
