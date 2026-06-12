'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GameState, PlayerState } from '@/shared/protocol/game-state';
import { getSpaceOwnerId, isSpaceMortgaged } from '../_lib/game-spaces';
import {
  createTradeDraftState,
  normalizeTradeDraft,
  resolveTradeTargetIdFromPosition,
  withToggledPosition,
  type TradeDraftState,
} from '../_lib/trade-draft';
import { ActiveOverlay } from '@/widgets/game-board';

interface UseTradeDraftArgs {
  game: GameState;
  viewerPlayer: PlayerState | null;
  viewerPlayerId: string | null;
  activeOverlay: ActiveOverlay | null;
  setSelectedTile: (position: number) => void;
}

export interface TradeDraftController {
  tradeDraft: TradeDraftState;
  resetDraft: () => void;
  selectBoardPosition: (position: number) => void;
  onGiveMoneyChange: (value: number) => void;
  onGetMoneyChange: (value: number) => void;
  onGiveCardsChange: (value: number) => void;
  onGetCardsChange: (value: number) => void;
  onClearOfferAssets: () => void;
  onClearRequestAssets: () => void;
}

/**
 * Owns the in-progress trade builder draft: the money/card/property selections the
 * viewer is assembling before proposing. Keeps the draft consistent with the live
 * game state (dropping mortgaged or no-longer-owned positions, clamping amounts).
 */
export function useTradeDraft({
  game,
  viewerPlayer,
  viewerPlayerId,
  activeOverlay,
  setSelectedTile,
}: UseTradeDraftArgs): TradeDraftController {
  const [tradeDraft, setTradeDraft] = useState<TradeDraftState>(createTradeDraftState);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setTradeDraft((currentDraft) => normalizeTradeDraft(currentDraft, game, viewerPlayer));
    }, 0);
    return () => window.clearTimeout(id);
  }, [game, viewerPlayer]);

  const resetDraft = useCallback(() => setTradeDraft(createTradeDraftState()), []);

  const selectBoardPosition = useCallback((position: number) => {
    setSelectedTile(position);
    if (activeOverlay !== ActiveOverlay.TRADE_BUILDER || !viewerPlayerId) return;

    if (isSpaceMortgaged(game, position)) return;

    const ownerId = getSpaceOwnerId(game, position);
    if (ownerId === viewerPlayerId) {
      setTradeDraft((currentDraft) => ({
        ...currentDraft,
        givePositions: withToggledPosition(currentDraft.givePositions, position),
      }));
      return;
    }

    const targetId = resolveTradeTargetIdFromPosition(game, viewerPlayerId, position, tradeDraft.targetId);
    if (!targetId) return;

    setTradeDraft((currentDraft) => {
      const nextTarget = targetId;
      const isRequestedProperty = getSpaceOwnerId(game, position) === nextTarget;
      const nextGetPositions = currentDraft.targetId === nextTarget
        ? (isRequestedProperty ? withToggledPosition(currentDraft.getPositions, position) : currentDraft.getPositions)
        : (isRequestedProperty ? new Set([position]) : new Set<number>());

      return {
        ...currentDraft,
        targetId: nextTarget,
        getMoney: currentDraft.targetId === nextTarget ? currentDraft.getMoney : 0,
        getCards: currentDraft.targetId === nextTarget ? currentDraft.getCards : 0,
        getPositions: nextGetPositions,
      };
    });
  }, [activeOverlay, game, setSelectedTile, tradeDraft.targetId, viewerPlayerId]);

  const onGiveMoneyChange = useCallback((value: number) => {
    setTradeDraft((currentDraft) => ({ ...currentDraft, giveMoney: value }));
  }, []);

  const onGetMoneyChange = useCallback((value: number) => {
    setTradeDraft((currentDraft) => ({ ...currentDraft, getMoney: value }));
  }, []);

  const onGiveCardsChange = useCallback((value: number) => {
    setTradeDraft((currentDraft) => ({ ...currentDraft, giveCards: value }));
  }, []);

  const onGetCardsChange = useCallback((value: number) => {
    setTradeDraft((currentDraft) => ({ ...currentDraft, getCards: value }));
  }, []);

  const onClearOfferAssets = useCallback(() => {
    setTradeDraft((currentDraft) => ({ ...currentDraft, givePositions: new Set() }));
  }, []);

  const onClearRequestAssets = useCallback(() => {
    setTradeDraft((currentDraft) => ({ ...currentDraft, getPositions: new Set() }));
  }, []);

  return {
    tradeDraft,
    resetDraft,
    selectBoardPosition,
    onGiveMoneyChange,
    onGetMoneyChange,
    onGiveCardsChange,
    onGetCardsChange,
    onClearOfferAssets,
    onClearRequestAssets,
  };
}
