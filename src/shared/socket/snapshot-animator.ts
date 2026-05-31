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
 *
 * Card gate — when a committed frame carries an activeCard the pipeline pauses and
 * waits for resolveCardGate() before processing the next frame. GameBoard calls
 * resolveCardGate() when the player clicks "Proceed" on the card overlay.
 */

import type { GameSnapshot } from '@/shared/protocol/permissions';
import { getWalkSteps } from '@/shared/config/board-layout';
import { getDeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';

const BOARD_SIZE = 40;
const DICE_SPIN_MS = 1000;
// Card-driven moves use a faster per-step rate so a long advance (e.g. 20 tiles)
// finishes in ≈1.2 s rather than ≈3.6 s.
const CARD_WALK_STEP_MS = 60;
// Forward path length above which we treat a move as backward (snap, no walk).
const MAX_FORWARD_STEPS = 20;
// Safety auto-release for the card gate if the player never clicks Proceed.
const CARD_GATE_TIMEOUT_MS = 60_000;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let queue: GameSnapshot[] = [];
let running = false;

// Whether the last *committed* snapshot contained an activeCard. Tracked here
// separately from the store so that a local updateGame({ activeCard: null }) by
// the Proceed handler doesn't confuse the next frame's cardResolved detection.
let prevCommittedHadCard = false;

// Card gate — resolves when the player clicks Proceed (or on timeout/reset).
let cardGateResolve: (() => void) | null = null;
let cardGateTimer: ReturnType<typeof setTimeout> | null = null;

/** Called by GameBoard when the player clicks "Proceed" on the card overlay. */
export function resolveCardGate(): void {
  if (cardGateTimer !== null) { clearTimeout(cardGateTimer); cardGateTimer = null; }
  if (cardGateResolve) { const r = cardGateResolve; cardGateResolve = null; r(); }
}

function waitForCardProceed(): Promise<void> {
  return new Promise((resolve) => {
    cardGateResolve = resolve;
    cardGateTimer = setTimeout(() => {
      cardGateTimer = null;
      cardGateResolve = null;
      resolve();
    }, CARD_GATE_TIMEOUT_MS);
  });
}

/** Queue an adapted snapshot for animated application. Safe to call rapidly. */
export function enqueueSnapshot(snapshot: GameSnapshot): void {
  queue.push(snapshot);
  if (!running) void drain();
}

/** Drop any pending frames (e.g. on unmount / disconnect). */
export function resetSnapshotPipeline(): void {
  queue = [];
  running = false;
  prevCommittedHadCard = false;
  resolveCardGate();
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

  const sum = dice ? dice.die1 + dice.die2 : null;
  const sentToJail = !prevPlayer?.jailStatus && !!nextPlayer?.jailStatus;

  // Normal dice-driven walk: mover advanced by exactly the dice sum, not jailed.
  const walked =
    oldPos !== null &&
    newPos !== null &&
    oldPos !== newPos &&
    sum !== null &&
    (oldPos + sum) % BOARD_SIZE === newPos &&
    !sentToJail;

  // Card-driven move: the previous committed frame had a card; this frame resolves
  // it. Only animate when going forward and the path is short enough (> MAX_FORWARD_STEPS
  // means the player moved backward — don't march them around the whole board).
  const cardResolved = prevCommittedHadCard && !next.game.activeCard;
  const cardSteps =
    cardResolved && oldPos !== null && newPos !== null && oldPos !== newPos && !sentToJail
      ? getWalkSteps(oldPos, newPos)
      : null;
  const cardMoved = cardSteps !== null && cardSteps.length <= MAX_FORWARD_STEPS;

  // Nothing animated → commit immediately.
  if (!diceChanged && !walked && !cardMoved) {
    commit(next);
    return;
  }

  // Phase 1 — dice spin.
  if (diceChanged) {
    ui.setIsRolling(true);
    await delay(DICE_SPIN_MS);
    ui.setIsRolling(false);
  }

  // Phase 2 — dice-driven walk, tile by tile.
  if (walked && oldPos !== null && newPos !== null) {
    const steps = getWalkSteps(oldPos, newPos);
    ui.setWalkState({ playerId: moverId, currentPos: oldPos });
    await walkSteps(moverId, steps, WALK_STEP_DURATION_MS);
    ui.setWalkState(null);
  }

  // Phase 3 — card-driven walk (after Proceed was clicked, resolved in prior gate).
  if (cardMoved && cardSteps && oldPos !== null) {
    ui.setWalkState({ playerId: moverId, currentPos: oldPos });
    await walkSteps(moverId, cardSteps, CARD_WALK_STEP_MS);
    ui.setWalkState(null);
  }

  // Phase 4 — commit the authoritative snapshot.
  commit(next);

  // Surface the deed modal when the viewer can buy the tile they just landed on.
  if (next.permissions.canBuyProperty && next.game.turn.currentPlayerId === next.game.viewerId) {
    const deed = newPos !== null ? getDeedInfo(newPos) : null;
    if (deed) useUiStore.getState().setActiveDeed(deed);
  }

  // Card gate — pause the pipeline until the player dismisses the card overlay.
  if (next.game.activeCard !== null) {
    await waitForCardProceed();
  }
}

function walkSteps(playerId: string, steps: number[], stepMs: number): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const step = () => {
      if (i >= steps.length) return resolve();
      useUiStore.getState().setWalkState({ playerId, currentPos: steps[i++] });
      setTimeout(step, stepMs);
    };
    setTimeout(step, 80);
  });
}

function commit(snapshot: GameSnapshot): void {
  prevCommittedHadCard = !!snapshot.game.activeCard;
  useGameStore.getState().setSnapshot(snapshot);
}
