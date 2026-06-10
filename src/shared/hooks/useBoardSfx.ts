'use client';

import { useEffect, useRef } from 'react';
import type { GameState } from '@/shared/protocol/game-state';
import { GameEventType, LogKind } from '@/shared/protocol/game-state.enums';
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
    preloadSfx(
      Sfx.DICE_ROLL, Sfx.NOTIFICATION, Sfx.AUCTION_BID,
      Sfx.PASSED_GO, Sfx.YOUR_TURN, Sfx.PAID, Sfx.CHAT_MESSAGE,
    );
  }, []);

  useEffect(() => {
    return onAnimation((instr) => {
      if (instr.type === 'roll_dice') playSfx(SFX_MAP.diceRoll);
    });
  }, []);

  useBalanceChange(gameState.players, () => playSfx(SFX_MAP.balanceChanged), gameState.log);
  useCurrentTurn(gameState.turn.currentPlayerId, gameState.viewerId, () => playSfx(SFX_MAP.myTurnStarted));

  const prevAuctionRef    = useRef(false);
  const prevHighestBidRef = useRef<number>(-1);
  const prevTradeIdRef    = useRef<string | null>(null);
  const prevLogLenRef     = useRef(0);

  const hasAuction  = gameState.auction !== null;
  const highestBid  = gameState.auction?.highestBid ?? -1;
  const tradeId     = gameState.trade?.id ?? null;
  const tradeStatus = gameState.trade?.status ?? null;
  const logLen      = gameState.log.length;
  const viewerId    = gameState.viewerId;

  useEffect(() => {
    // ── Auction start ─────────────────────────────────────────────────────────
    if (hasAuction && !prevAuctionRef.current) {
      playSfx(SFX_MAP.auctionStarted);
      prevHighestBidRef.current = highestBid;
    }
    prevAuctionRef.current = hasAuction;

    // ── New bid landed ────────────────────────────────────────────────────────
    if (hasAuction) {
      if (highestBid > prevHighestBidRef.current) {
        playSfx(SFX_MAP.newBidLanded);
      }
      prevHighestBidRef.current = highestBid;
    } else {
      prevHighestBidRef.current = -1;
    }

    // ── Trade proposed ────────────────────────────────────────────────────────
    if (tradeId && tradeId !== prevTradeIdRef.current && tradeStatus === 'pending') {
      playSfx(SFX_MAP.tradeProposed);
    }
    prevTradeIdRef.current = tradeId;

    // ── New log entries ───────────────────────────────────────────────────────
    if (logLen > prevLogLenRef.current) {
      const newEntries = gameState.log.slice(prevLogLenRef.current);

      if (newEntries.some((e) => e.kind === LogKind.EVENT && e.event?.type === GameEventType.PassedGo)) {
        playSfx(SFX_MAP.passedGo);
      }

      if (newEntries.some(
        (e) =>
          (e.kind === LogKind.CHAT || e.kind === LogKind.STICKER) &&
          e.playerId !== viewerId,
      )) {
        playSfx(SFX_MAP.incomingChat);
      }
    }
    prevLogLenRef.current = logLen;
  }, [gameState.log, hasAuction, highestBid, tradeId, tradeStatus, logLen, viewerId]);
}
