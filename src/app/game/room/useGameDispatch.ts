'use client';

import { useCallback } from 'react';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import type { SnapshotMessage } from '@/shared/protocol/network';
import { ServerEventType } from '@/shared/protocol/network';
import { dispatchToMockServer } from '@/shared/mocks/mock-server';
import { getWalkSteps } from '@/features/game-board';
import { getDeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Returns `dispatch(cmd)`.
 *
 * Reads the latest state synchronously via store.getState() inside async
 * callbacks — no stale-closure problem, no prop threading.
 *
 * Flow:
 *   ClientCommand → dispatchToMockServer → ServerMessage[] → applyServerMessage
 */
export function useGameDispatch() {
  const { setSnapshot, applyServerMessage } = useGameStore();
  const { setIsRolling, setWalkState, setActiveDeed } = useUiStore();

  const dispatch = useCallback(
    async (cmd: ClientCommand): Promise<void> => {

      // ── Roll dice — animation-aware ─────────────────────────────────────────
      if (cmd.type === CommandType.RollDice) {
        if (useUiStore.getState().isRolling) return;

        const { snapshot } = useGameStore.getState();
        setIsRolling(true);

        const messages  = dispatchToMockServer(snapshot.game, cmd);
        const snapshotMsg = messages.find(
          (m): m is SnapshotMessage => m.type === ServerEventType.Snapshot,
        );
        if (!snapshotMsg) {
          setIsRolling(false);
          return;
        }

        const nextGame = snapshotMsg.game;
        const { diceRoll } = nextGame.turn;
        const viewerId = snapshot.game.viewerId;
        const oldPos   = snapshot.game.players.find((p) => p.id === viewerId)?.position ?? 0;
        const nextPlayer = nextGame.players.find((p) => p.id === viewerId);
        const newPos   = nextPlayer?.position ?? oldPos;
        // Sent to jail this roll (3 doubles / go-to-jail corner) → teleport, don't walk a lap.
        const teleported = nextPlayer?.jailStatus != null;

        // Phase 1 — dice spin
        await delay(1200);
        setIsRolling(false);

        // Show dice result; mark canRoll false immediately
        setSnapshot({
          game:        { ...snapshot.game, turn: { ...snapshot.game.turn, diceRoll } },
          permissions: { ...snapshot.permissions, canRoll: false },
        });
        await delay(500);

        // Phase 2 — walk token step-by-step (skipped on teleport)
        if (!teleported) {
          const steps = getWalkSteps(oldPos, newPos);
          setWalkState({ playerId: viewerId, currentPos: oldPos });

          await new Promise<void>((resolve) => {
            let i = 0;
            function step() {
              if (i >= steps.length) { resolve(); return; }
              setWalkState({ playerId: viewerId, currentPos: steps[i++] });
              setTimeout(step, WALK_STEP_DURATION_MS);
            }
            setTimeout(step, 80);
          });
        }

        // Phase 3 — apply all server messages, clear walk overlay
        setWalkState(null);
        for (const msg of messages) applyServerMessage(msg);

        if (snapshotMsg.permissions.canBuyProperty) {
          setActiveDeed(getDeedInfo(newPos));
        }

        return;
      }

      // ── All other commands ──────────────────────────────────────────────────
      const { snapshot } = useGameStore.getState();
      const messages     = dispatchToMockServer(snapshot.game, cmd);
      for (const msg of messages) applyServerMessage(msg);
    },
    [setSnapshot, applyServerMessage, setIsRolling, setWalkState, setActiveDeed],
  );

  return { dispatch };
}
