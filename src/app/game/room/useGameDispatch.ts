'use client';

import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import type { GameState } from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import { processCommand } from '@/shared/mocks/command-processor';
import { getWalkSteps } from '@/features/game-board';
import { getDeedInfo } from '@/features/deed';
import type { DeedInfo } from '@/features/deed';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';
import { WALK_STEP_DURATION_MS } from '@/shared/config/constants';

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

/**
 * Returns a `dispatch` function that:
 * - For RollDice: orchestrates dice + walk animations, then commits the new state.
 * - For everything else: applies processCommand synchronously to the previous state.
 *
 * Components never call setGameState directly — they dispatch a ClientCommand.
 */
export function useGameDispatch(
  gameStateRef: React.RefObject<GameState>,
  { setGameState, setIsRolling, setWalkState, setActiveDeed }: Setters,
) {
  const isRollingRef = useRef(false);

  const dispatch = useCallback(
    async (cmd: ClientCommand): Promise<void> => {

      // ── Roll dice ───────────────────────────────────────────────────────────
      if (cmd.type === CommandType.RollDice) {
        if (isRollingRef.current) return;
        isRollingRef.current = true;
        setIsRolling(true);

        // Pre-compute the result so animation and final state are consistent.
        const current = gameStateRef.current!;
        const nextState = processCommand(current, cmd);
        const { diceRoll } = nextState.turn;

        const viewerId = current.viewerId;
        const viewer   = current.players.find((p) => p.id === viewerId)!;
        const oldPos   = viewer.position;
        const newPos   = nextState.players.find((p) => p.id === viewerId)?.position ?? oldPos;

        // Phase 1 — dice spin
        await delay(1200);
        setIsRolling(false);

        // Show dice result before the walk starts
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

        // Phase 3 — commit full new state, clear walk overlay
        setWalkState(null);
        setGameState(nextState);
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
      setGameState((prev) => processCommand(prev, cmd));
    },
    // gameStateRef is stable; setters from useState are stable
    [gameStateRef, setGameState, setIsRolling, setWalkState, setActiveDeed],
  );

  return { dispatch };
}
