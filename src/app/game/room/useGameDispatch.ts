'use client';

import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import { applyMessage } from '@/shared/protocol/network';
import { dispatchToMockServer } from '@/shared/mocks/mock-server';
import { getWalkSteps } from '@/features/game-board';
import { getDeedInfo } from '@/features/deed';
import type { DeedInfo } from '@/features/deed';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';
import { WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import type { ServerMessage } from '@/shared/protocol/network';
import { ServerEventType } from '@/shared/protocol/network';

export type WalkState = { playerId: string; currentPos: number };

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Setters = {
  setGameState:  Dispatch<SetStateAction<GameState>>;
  setIsRolling:  Dispatch<SetStateAction<boolean>>;
  setWalkState:  Dispatch<SetStateAction<WalkState | null>>;
  setActiveDeed: Dispatch<SetStateAction<DeedInfo | null>>;
};

/** Apply a sequence of ServerMessages, draining each into the state reducer. */
function applyMessages(
  messages: ServerMessage[],
  setGameState: Dispatch<SetStateAction<GameState>>,
): void {
  for (const msg of messages) {
    setGameState((prev) => applyMessage(prev, msg));
  }
}

/**
 * Returns a `dispatch` function components use to express player intent.
 *
 * Flow for every command:
 *   ClientCommand
 *     → dispatchToMockServer   (mock backend: command-processor + ServerMessage factory)
 *     → [ServerMessage, ...]   (Snapshot / Patch / Log / Error)
 *     → applyMessage           (pure reducer, applied via setGameState)
 *
 * RollDice is the only command that requires animation coordination:
 *   pre-compute the result → animate → then apply the messages.
 */
export function useGameDispatch(
  gameStateRef: React.RefObject<GameState>,
  { setGameState, setIsRolling, setWalkState, setActiveDeed }: Setters,
) {
  const isRollingRef = useRef(false);

  const dispatch = useCallback(
    async (cmd: ClientCommand): Promise<void> => {

      // ── Roll dice — animation-aware ─────────────────────────────────────────
      if (cmd.type === CommandType.RollDice) {
        if (isRollingRef.current) return;
        isRollingRef.current = true;
        setIsRolling(true);

        // Pre-compute next state so dice result and walk destination are known
        // before animation starts. Animation and final state stay consistent.
        const current  = gameStateRef.current!;
        const messages = dispatchToMockServer(current, cmd);

        // Extract the Snapshot to read animation params from
        const snapshot = messages.find((m) => m.type === ServerEventType.Snapshot);
        if (!snapshot || snapshot.type !== ServerEventType.Snapshot) {
          setIsRolling(false);
          isRollingRef.current = false;
          return;
        }

        const nextState = snapshot.game;
        const { diceRoll } = nextState.turn;
        const viewerId  = current.viewerId;
        const oldPos    = current.players.find((p) => p.id === viewerId)?.position ?? 0;
        const newPos    = nextState.players.find((p) => p.id === viewerId)?.position ?? oldPos;

        // Phase 1 — dice spin
        await delay(1200);
        setIsRolling(false);

        // Show dice result while walk is pending
        setGameState((prev) => ({
          ...prev,
          turn: {
            ...prev.turn,
            diceRoll,
            actionsAvailable: { ...prev.turn.actionsAvailable, canRoll: false },
          },
        }));
        await delay(500);

        // Phase 2 — walk token step-by-step
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

        // Phase 3 — apply all server messages, clear walk overlay
        setWalkState(null);
        applyMessages(messages, setGameState);
        isRollingRef.current = false;

        // Show deed card if the viewer landed on an unowned purchasable space
        const landedSpace = BOARD[newPos];
        const isPurchasable =
          landedSpace != null &&
          (landedSpace.type === SpaceType.PROPERTY ||
            landedSpace.type === SpaceType.RAILROAD ||
            landedSpace.type === SpaceType.UTILITY);
        const isUnowned = nextState.spaces[newPos]?.ownerId === null;

        if (!nextState.activeCard && isPurchasable && isUnowned) {
          setActiveDeed(getDeedInfo(newPos));
        }

        return;
      }

      // ── All other commands ──────────────────────────────────────────────────
      const current  = gameStateRef.current!;
      const messages = dispatchToMockServer(current, cmd);
      applyMessages(messages, setGameState);
    },
    [gameStateRef, setGameState, setIsRolling, setWalkState, setActiveDeed],
  );

  return { dispatch };
}
