'use client';

import { useEffect, useRef } from 'react';
import type { GameState } from '@/shared/protocol/game-state';
import { playSfx, preloadSfx } from '@/shared/lib/sfx';

export function useBoardSfx(gameState: GameState) {
  // Preload all sounds once on mount (dice_roll/auction_bid preloaded for handler use too)
  useEffect(() => {
    preloadSfx('dice_roll', 'notification', 'auction_bid', 'passed_go');
  }, []);

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

    // ── Passed Go ─────────────────────────────────────────────────────────────
    // The BE log entry text contains "passed GO" when a player collects the bonus.
    const logLen = gameState.log.length;
    if (logLen > prevLogLenRef.current) {
      const newEntries = gameState.log.slice(prevLogLenRef.current);
      if (newEntries.some((e) => /passed GO/i.test(e.text))) {
        playSfx('passed_go');
      }
    }
    prevLogLenRef.current = logLen;
  }, [gameState]);
}
