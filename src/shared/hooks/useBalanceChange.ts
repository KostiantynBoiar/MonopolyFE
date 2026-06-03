'use client';

import { useEffect, useRef } from 'react';

interface PlayerWithBalance {
  id: string;
  balance: number;
}

export interface BalanceChange {
  playerId: string;
  delta: number;
}

/**
 * Fires `onChange` with every balance delta since the previous render.
 * Skips the initial population (no previous value → no change emitted).
 * The callback ref is kept fresh so callers don't need to wrap it in useCallback.
 */
export function useBalanceChange(
  players: PlayerWithBalance[],
  onChange: (changes: BalanceChange[]) => void,
): void {
  const prevRef = useRef<Map<string, number>>(new Map());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const changes: BalanceChange[] = [];

    for (const { id, balance } of players) {
      const prev = prevRef.current.get(id);
      if (prev !== undefined && prev !== balance) {
        changes.push({ playerId: id, delta: balance - prev });
      }
      prevRef.current.set(id, balance);
    }

    if (changes.length > 0) {
      onChangeRef.current(changes);
    }
  }, [players]);
}
