'use client';

import { useCallback } from 'react';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import { useCommandBus } from '@/stores/command-bus';
import { useUiStore } from '@/stores/ui-store';

/**
 * Returns `dispatch(cmd)` — the single entry point for player actions.
 *
 * Server-authoritative: dispatch serializes the command and sends it over the live
 * WebSocket (via the command bus). It does NOT mutate game state — the resulting
 * `game.state` snapshot arrives asynchronously and is folded in (with animation) by
 * the snapshot pipeline in `useGameSocket`.
 *
 * The only local side effect is an optimistic rolling lock, so the Roll button can't
 * be double-fired during the network round-trip; the pipeline clears it on the next
 * snapshot, and a server error clears it too (see useGameSocket).
 */
export function useGameDispatch() {
  const dispatch = useCallback((cmd: ClientCommand) => {
    if (cmd.type === CommandType.RollDice || cmd.type === CommandType.RollInJail) {
      useUiStore.getState().setIsRolling(true);
    }
    const send = useCommandBus.getState().sendCommand;
    send?.(cmd);
  }, []);

  return { dispatch };
}
