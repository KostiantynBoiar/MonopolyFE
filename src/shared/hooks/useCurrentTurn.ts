'use client';

import { useEffect, useRef } from 'react';

/**
 * Fires `onYourTurn` once each time `currentPlayerId` becomes `viewerId`.
 * Skips the initial render so rejoining mid-turn doesn't trigger it.
 */
export function useCurrentTurn(
  currentPlayerId: string,
  viewerId: string | null,
  onYourTurn: () => void,
): void {
  const prevPlayerIdRef = useRef<string | null>(null);
  const onYourTurnRef = useRef(onYourTurn);
  onYourTurnRef.current = onYourTurn;

  useEffect(() => {
    const prev = prevPlayerIdRef.current;
    prevPlayerIdRef.current = currentPlayerId;

    // Skip initial population and fire only on actual turn transitions
    if (prev === null || prev === currentPlayerId) return;
    if (viewerId && currentPlayerId === viewerId) {
      onYourTurnRef.current();
    }
  }, [currentPlayerId, viewerId]);
}
