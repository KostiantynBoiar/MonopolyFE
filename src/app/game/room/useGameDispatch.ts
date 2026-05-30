'use client';

import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import type { ServerMessage, SnapshotMessage } from '@/shared/protocol/network';
import { applyMessage, ServerEventType } from '@/shared/protocol/network';
import { dispatchToMockServer } from '@/shared/mocks/mock-server';
import { getWalkSteps } from '@/features/game-board';
import { getDeedInfo } from '@/features/deed';
import type { DeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS } from '@/shared/config/constants';

export type WalkState = { playerId: string; currentPos: number };

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Setters = {
  setSnapshot:   Dispatch<SetStateAction<GameSnapshot>>;
  setIsRolling:  Dispatch<SetStateAction<boolean>>;
  setWalkState:  Dispatch<SetStateAction<WalkState | null>>;
  setActiveDeed: Dispatch<SetStateAction<DeedInfo | null>>;
};

function applyMessages(
  messages: ServerMessage[],
  setSnapshot: Dispatch<SetStateAction<GameSnapshot>>,
): void {
  for (const msg of messages) {
    setSnapshot((prev) => applyMessage(prev, msg));
  }
}

/**
 * Dispatch flow for every command:
 *   ClientCommand
 *     → dispatchToMockServer   (mock backend → ServerMessage[])
 *     → applyMessage           (pure reducer on GameSnapshot)
 *
 * RollDice pre-computes the Snapshot, sequences animation, then applies messages.
 */
export function useGameDispatch(
  snapshotRef: React.RefObject<GameSnapshot>,
  { setSnapshot, setIsRolling, setWalkState, setActiveDeed }: Setters,
) {
  const isRollingRef = useRef(false);

  const dispatch = useCallback(
    async (cmd: ClientCommand): Promise<void> => {

      // ── Roll dice — animation-aware ─────────────────────────────────────────
      if (cmd.type === CommandType.RollDice) {
        if (isRollingRef.current) return;
        isRollingRef.current = true;
        setIsRolling(true);

        const current  = snapshotRef.current!;
        const messages = dispatchToMockServer(current.game, cmd);

        const snapshot = messages.find(
          (m): m is SnapshotMessage => m.type === ServerEventType.Snapshot,
        );
        if (!snapshot) {
          setIsRolling(false);
          isRollingRef.current = false;
          return;
        }

        const nextGame  = snapshot.game;
        const { diceRoll } = nextGame.turn;
        const viewerId  = current.game.viewerId;
        const oldPos    = current.game.players.find((p) => p.id === viewerId)?.position ?? 0;
        const newPos    = nextGame.players.find((p) => p.id === viewerId)?.position ?? oldPos;

        // Phase 1 — dice spin
        await delay(1200);
        setIsRolling(false);

        // Show dice result, mark canRoll false immediately
        setSnapshot((prev) => ({
          game:        { ...prev.game, turn: { ...prev.game.turn, diceRoll } },
          permissions: { ...prev.permissions, canRoll: false },
        }));
        await delay(500);

        // Phase 2 — walk token
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

        // Phase 3 — commit all server messages, clear walk overlay
        setWalkState(null);
        applyMessages(messages, setSnapshot);
        isRollingRef.current = false;

        // Show deed when server says the viewer can buy
        if (snapshot.permissions.canBuyProperty) {
          setActiveDeed(getDeedInfo(newPos));
        }

        return;
      }

      // ── All other commands ──────────────────────────────────────────────────
      const messages = dispatchToMockServer(snapshotRef.current!.game, cmd);
      applyMessages(messages, setSnapshot);
    },
    [snapshotRef, setSnapshot, setIsRolling, setWalkState, setActiveDeed],
  );

  return { dispatch };
}
