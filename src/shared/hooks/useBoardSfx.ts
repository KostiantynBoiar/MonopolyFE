'use client';

import { useEffect, useRef } from 'react';
import type { GameState } from '@/shared/protocol/game-state';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { Sfx, playSfx, preloadSfx } from '@/shared/lib/sfx';
import { onAnimation } from '@/shared/socket/timeline-executor';
import { useBalanceChange } from './useBalanceChange';
import { useCurrentTurn } from './useCurrentTurn';

// event → sound
const SFX_MAP = {
  diceRoll:       Sfx.DICE_ROLL,
  balanceChanged: Sfx.PAID,
  myTurnStarted:  Sfx.YOUR_TURN,
  auctionStarted: Sfx.NOTIFICATION,
  newBidLanded:   Sfx.AUCTION_BID,
  tradeProposed:  Sfx.NOTIFICATION,
  passedGo:       Sfx.PASSED_GO,
  incomingChat:   Sfx.CHAT_MESSAGE,
} as const;

export function useBoardSfx(gameState: GameState) {
  useEffect(() => {
    // Only preload files that exist on disk; omit PAID / CHAT_MESSAGE until added.
    preloadSfx(Sfx.DICE_ROLL, Sfx.NOTIFICATION, Sfx.AUCTION_BID, Sfx.PASSED_GO, Sfx.YOUR_TURN);
  }, []);

  useEffect(() => {
    return onAnimation((instr) => {
      if (instr.type === 'roll_dice') playSfx(SFX_MAP.diceRoll);
    });
  }, []);

  useBalanceChange(gameState.players, () => playSfx(SFX_MAP.balanceChanged));
  useCurrentTurn(gameState.turn.currentPlayerId, gameState.viewerId, () => playSfx(SFX_MAP.myTurnStarted));

  const prevAuctionRef    = useRef(false);
  const prevHighestBidRef = useRef<number>(-1);
  const prevTradeIdRef    = useRef<string | null>(null);
  const prevLogLenRef     = useRef(0);

  useEffect(() => {
    // ── Auction start ─────────────────────────────────────────────────────────
    const hasAuction = gameState.auction !== null;
    if (hasAuction && !prevAuctionRef.current) {
      playSfx(SFX_MAP.auctionStarted);
      prevHighestBidRef.current = gameState.auction!.highestBid;
    }
    prevAuctionRef.current = hasAuction;

    // ── New bid landed ────────────────────────────────────────────────────────
    if (hasAuction) {
      const currentBid = gameState.auction!.highestBid;
      if (currentBid > prevHighestBidRef.current) {
        playSfx(SFX_MAP.newBidLanded);
      }
      prevHighestBidRef.current = currentBid;
    } else {
      prevHighestBidRef.current = -1;
    }

    // ── Trade proposed ────────────────────────────────────────────────────────
    const tradeId = gameState.trade?.id ?? null;
    if (tradeId && tradeId !== prevTradeIdRef.current && gameState.trade?.status === 'pending') {
      playSfx(SFX_MAP.tradeProposed);
    }
    prevTradeIdRef.current = tradeId;

    // ── New log entries ───────────────────────────────────────────────────────
    const logLen = gameState.log.length;
    if (logLen > prevLogLenRef.current) {
      const newEntries = gameState.log.slice(prevLogLenRef.current);

      if (newEntries.some((e) => /passed GO/i.test(e.text))) {
        playSfx(SFX_MAP.passedGo);
      }

      if (newEntries.some(
        (e) =>
          (e.kind === LogKind.CHAT || e.kind === LogKind.STICKER) &&
          e.playerId !== gameState.viewerId,
      )) {
        playSfx(SFX_MAP.incomingChat);
      }
    }
    prevLogLenRef.current = logLen;
  }, [gameState]);
}
