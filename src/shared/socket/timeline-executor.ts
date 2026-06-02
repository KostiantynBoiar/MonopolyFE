/**
 * Timeline executor.
 *
 * The backend now decides the animation sequence and ships an ordered
 * `animationTimeline` with every authoritative `game.state` frame. This module simply
 * REPLAYS those instructions — there is no snapshot diffing or movement inference (that
 * was the old snapshot-animator).
 *
 * Frames are processed through a serial queue so a burst of snapshots animates in order.
 * A `wait_for_player` instruction pauses the replay until the gate is resolved — either
 * by the affected player clicking Continue (optimistic, local) or by the server's
 * `game.animation_continue` broadcast (which un-pauses every client together).
 */

import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { ActiveCard } from '@/shared/protocol/game-state';
import { getWalkSteps } from '@/shared/config/board-layout';
import { getDeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS, CARD_WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';

const BOARD_SIZE = 40;
const DICE_SPIN_MS = 1000;
// Forward path length above which a move is treated as backward (e.g. "go back 3").
const MAX_FORWARD_STEPS = 20;
// Safety auto-release for a wait gate if Continue never arrives.
const GATE_TIMEOUT_MS = 60_000;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let queue: GameSnapshot[] = [];
let running = false;
// Incremented on reset; each drain() captures its own value and bails if it goes stale.
let generation = 0;

// Active wait gate, keyed by interactionId so a stale continue can't resolve a new gate.
let gate: { id: string; resolve: () => void } | null = null;
let gateTimer: ReturnType<typeof setTimeout> | null = null;

function openGate(id: string): Promise<void> {
  useUiStore.getState().setPendingInteractionId(id);
  return new Promise<void>((resolve) => {
    gate = { id, resolve };
    gateTimer = setTimeout(() => closeGate(id), GATE_TIMEOUT_MS);
  });
}

function closeGate(id: string): void {
  if (!gate || (id !== '' && gate.id !== id)) return; // id==='' force-closes (reset)
  if (gateTimer !== null) { clearTimeout(gateTimer); gateTimer = null; }
  const { resolve } = gate;
  gate = null;
  useUiStore.getState().setPendingInteractionId(null);
  resolve();
}

/** Resume the paused timeline. Called by the affected player's Continue click and by the
 *  server's `game.animation_continue` broadcast (idempotent). */
export function resolveAnimationGate(interactionId: string): void {
  closeGate(interactionId);
}

/** Queue an adapted snapshot for replay. Safe to call rapidly. */
export function enqueueSnapshot(snapshot: GameSnapshot): void {
  queue.push(snapshot);
  if (!running) void drain();
}

/** Drop pending frames + release any gate (on unmount / disconnect). */
export function resetSnapshotPipeline(): void {
  generation++;
  queue = [];
  running = false;
  closeGate(''); // force-release whatever gate is open
}

async function drain(): Promise<void> {
  const myGeneration = generation;
  running = true;
  while (queue.length > 0 && generation === myGeneration) {
    const next = queue.shift()!;
    await applyTimeline(next, myGeneration);
  }
  if (generation === myGeneration) running = false;
}

async function applyTimeline(next: GameSnapshot, myGeneration: number): Promise<void> {
  const ui = useUiStore.getState();
  const timeline = next.animationTimeline;

  // Nothing to replay (buy/build/reconnect/system frames) → commit immediately.
  if (timeline.length === 0) {
    commit(next);
    maybeSurfaceDeed(next);
    return;
  }

  const hasCard = timeline.some((i) => i.type === 'show_card');
  // Track the moving player's last position so show_card can be committed spatially
  // (player standing on the card square, not the final destination).
  let lastMover = next.game.turn.currentPlayerId;
  let lastPos: number | null = null;

  for (const instr of timeline) {
    if (generation !== myGeneration) return;

    switch (instr.type) {
      case 'roll_dice':
        ui.setIsRolling(true);
        await delay(DICE_SPIN_MS);
        ui.setIsRolling(false);
        break;

      case 'move': {
        const steps = walkPath(instr.fromPosition, instr.toPosition);
        const fast = instr.speed === 'fast';
        const stepMs = fast ? CARD_WALK_STEP_DURATION_MS : WALK_STEP_DURATION_MS;
        ui.setWalkState({ playerId: instr.playerId, currentPos: instr.fromPosition, fast });
        await walkSteps(instr.playerId, steps, stepMs, fast);
        ui.setWalkState(null);
        ui.setIsRolling(false); // clear optimistic lock if dice spin was skipped
        lastMover = instr.playerId;
        lastPos = instr.toPosition;
        break;
      }

      case 'show_card':
        // Commit a patched snapshot: the mover stands on the card square with the card
        // visible, so the overlay makes spatial sense while we wait.
        commit(patchForCard(next, lastMover, lastPos, instr.card));
        break;

      case 'wait_for_player':
        await openGate(instr.interactionId);
        break;
    }
  }

  if (generation !== myGeneration) return;

  // Final authoritative commit. If a card was shown, the player has now acknowledged it,
  // so clear it (the BE keeps active_card one extra command for late joiners).
  const finalSnapshot = hasCard
    ? { ...next, game: { ...next.game, activeCard: null } }
    : next;
  commit(finalSnapshot);
  maybeSurfaceDeed(next);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Step path from→to. Forward by default; backward when the forward arc is long
 *  (a "go back N" card), so the token visibly steps backward instead of looping. */
function walkPath(from: number, to: number): number[] {
  const forward = getWalkSteps(from, to);
  if (forward.length <= MAX_FORWARD_STEPS) return forward;
  const steps: number[] = [];
  let p = from;
  while (p !== to) {
    p = (p - 1 + BOARD_SIZE) % BOARD_SIZE;
    steps.push(p);
  }
  return steps;
}

function patchForCard(
  snapshot: GameSnapshot,
  playerId: string,
  position: number | null,
  card: ActiveCard,
): GameSnapshot {
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeCard: card,
      players: position === null
        ? snapshot.game.players
        : snapshot.game.players.map((p) => (p.id === playerId ? { ...p, position } : p)),
    },
  };
}

function maybeSurfaceDeed(snapshot: GameSnapshot): void {
  const pendingPos = snapshot.game.turn.pendingBuyPosition;
  const viewerId = snapshot.game.viewerId;
  const isViewer = !viewerId || viewerId === snapshot.game.turn.currentPlayerId;
  if (pendingPos !== null && isViewer) {
    const deed = getDeedInfo(pendingPos);
    if (deed) useUiStore.getState().setActiveDeed(deed);
  }
}

function walkSteps(playerId: string, steps: number[], stepMs: number, fast = false): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const step = () => {
      if (i >= steps.length) return resolve();
      useUiStore.getState().setWalkState({ playerId, currentPos: steps[i++], fast });
      setTimeout(step, stepMs);
    };
    setTimeout(step, 80);
  });
}

function commit(snapshot: GameSnapshot): void {
  useGameStore.getState().setSnapshot(snapshot);
}
