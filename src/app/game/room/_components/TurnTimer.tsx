'use client';

import { useEffect, useState } from 'react';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

// The backend sends an absolute epoch-ms deadline; we tick locally against Date.now()
// and re-sync automatically whenever a new snapshot updates the deadline prop. Minor
// client/server clock skew is cosmetic — the backend enforces the real deadline.

const URGENT_MS = 15_000;

function remainingMs(deadlineMs: number | null, now = Date.now()): number {
  if (deadlineMs == null) return 0;
  return Math.max(0, deadlineMs - now);
}

function format(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function TurnTimer({ deadlineMs }: { deadlineMs: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, []);

  if (deadlineMs == null) return null;

  const ms = remainingMs(deadlineMs, now);
  const urgent = ms <= URGENT_MS;
  return (
    <span
      className="font-mono font-bold tabular-nums"
      style={{
        fontSize: 'clamp(13px,1.9vmin,20px)',
        color: urgent ? BOARD_TILE_COLORS.propertyRed : GAME_BOARD_COLORS.text,
      }}
    >
      {format(ms)}
    </span>
  );
}
