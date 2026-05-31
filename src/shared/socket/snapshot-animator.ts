/**
 * Snapshot animation pipeline.
 *
 * The server is authoritative and sends full snapshots — it does NOT stream the
 * granular move/landing events the old mock emitted. So we recover the dice-spin +
 * step-walk animation by DIFFING the previous committed snapshot against each
 * incoming one: if the current player advanced by exactly the dice sum (a normal
 * roll, not a teleport/card/jail move), we play the spin, walk the token tile by
 * tile, then commit. Everything else commits immediately.
 *
 * Frames are processed through a serial queue so a burst of snapshots (e.g. roll
 * then auto-advance) animates in order instead of overlapping.
 */

import type { GameSnapshot } from '@/shared/protocol/permissions';
import { getWalkSteps } from '@/shared/config/board-layout';
import { getDeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';

const BOARD_SIZE = 40;
const DICE_SPIN_MS = 1000;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let queue: GameSnapshot[] = [];
let running = false;

/** Queue an adapted snapshot for animated application. Safe to call rapidly. */
export function enqueueSnapshot(snapshot: GameSnapshot): void {
  queue.push(snapshot);
  if (!running) void drain();
}

/** Drop any pending frames (e.g. on unmount / disconnect). */
export function resetSnapshotPipeline(): void {
  queue = [];
  running = false;
}

async function drain(): Promise<void> {
  running = true;
  while (queue.length > 0) {
    const next = queue.shift()!;
    await applyFrame(next);
  }
  running = false;
}

async function applyFrame(next: GameSnapshot): Promise<void> {
  const prev = useGameStore.getState().snapshot;
  const ui = useUiStore.getState();

  const moverId = next.game.turn.currentPlayerId;
  const prevPlayer = prev.game.players.find((p) => p.id === moverId);
  const nextPlayer = next.game.players.find((p) => p.id === moverId);

  const oldPos = prevPlayer?.position ?? null;
  const newPos = nextPlayer?.position ?? null;

  const dice = next.game.turn.diceRoll;
  const diceChanged =
    !!dice && JSON.stringify(dice) !== JSON.stringify(prev.game.turn.diceRoll);

  // A normal roll: the mover advanced by exactly the dice sum (mod board size) and
  // wasn't sent to jail. Card moves / teleports / jail don't satisfy this → snap.
  const sum = dice ? dice.die1 + dice.die2 : null;
  const sentToJail = !prevPlayer?.jailStatus && !!nextPlayer?.jailStatus;
  const walked =
    oldPos !== null &&
    newPos !== null &&
    oldPos !== newPos &&
    sum !== null &&
    (oldPos + sum) % BOARD_SIZE === newPos &&
    !sentToJail;

  // No roll-driven animation → commit straight away.
  if (!diceChanged && !walked) {
    commit(next);
    return;
  }

  // Phase 1 — dice spin.
  if (diceChanged) {
    ui.setIsRolling(true);
    await delay(DICE_SPIN_MS);
    ui.setIsRolling(false);
  }

  // Phase 2 — walk the token tile by tile (board still shows the pre-move snapshot).
  if (walked && oldPos !== null && newPos !== null) {
    const steps = getWalkSteps(oldPos, newPos);
    ui.setWalkState({ playerId: moverId, currentPos: oldPos });
    await walkSteps(moverId, steps);
    ui.setWalkState(null);
  }

  // Phase 3 — commit the authoritative snapshot.
  commit(next);

  // Surface the deed modal when the viewer can buy the tile they just landed on.
  if (next.permissions.canBuyProperty && next.game.turn.currentPlayerId === next.game.viewerId) {
    const deed = newPos !== null ? getDeedInfo(newPos) : null;
    if (deed) useUiStore.getState().setActiveDeed(deed);
  }
}

function walkSteps(playerId: string, steps: number[]): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const step = () => {
      if (i >= steps.length) return resolve();
      useUiStore.getState().setWalkState({ playerId, currentPos: steps[i++] });
      setTimeout(step, WALK_STEP_DURATION_MS);
    };
    setTimeout(step, 80);
  });
}

function commit(snapshot: GameSnapshot): void {
  useGameStore.getState().setSnapshot(snapshot);
}
