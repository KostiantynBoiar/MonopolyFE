'use client';

import { useEffect, useRef } from 'react';
import type { GameState } from '@/shared/protocol/game-state';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { playSfx, preloadSfx } from '@/shared/lib/sfx';
import { onAnimation } from '@/shared/socket/timeline-executor';
import { useBalanceChange } from './useBalanceChange';

export function useBoardSfx(gameState: GameState) {
  // Preload all sounds once on mount
  useEffect(() => {
    preloadSfx('dice_roll', 'notification', 'auction_bid', 'passed_go', 'paid');
  }, []);

  // Play sounds driven by the animation timeline so all players hear them together.
  useEffect(() => {
    return onAnimation((instr) => {
      if (instr.type === 'roll_dice') playSfx('dice_roll');
    });
  }, []);

  useBalanceChange(gameState.players, () => playSfx('paid'));

  const prevAuctionRef = useRef(false);
  const prevTradeIdRef = useRef<string | null>(null);
  const prevLogLenRef  = useRef(0);

  useEffect(() => {
    // ── Auction start ─────────────────────────────────────────────────────────
    const hasAuction = gameState.auction !== null;
    if (hasAuction && !prevAuctionRef.current) {
      playSfx('notification');
    }
    prevAuctionRef.current = hasAuction;

    // ── Trade proposed ────────────────────────────────────────────────────────
    const tradeId = gameState.trade?.id ?? null;
    if (tradeId && tradeId !== prevTradeIdRef.current && gameState.trade?.status === 'pending') {
      playSfx('notification');
    }
    prevTradeIdRef.current = tradeId;

    // ── New log entries ───────────────────────────────────────────────────────
    const logLen = gameState.log.length;
    if (logLen > prevLogLenRef.current) {
      const newEntries = gameState.log.slice(prevLogLenRef.current);

      // Passed Go
      if (newEntries.some((e) => /passed GO/i.test(e.text))) {
        playSfx('passed_go');
      }

      // Incoming chat or sticker from another player
      if (newEntries.some(
        (e) =>
          (e.kind === LogKind.CHAT || e.kind === LogKind.STICKER) &&
          e.playerId !== gameState.viewerId,
      )) {
        playSfx('notification');
      }
    }
    prevLogLenRef.current = logLen;
  }, [gameState]);
}
