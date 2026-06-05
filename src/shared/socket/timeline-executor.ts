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
import type { GameState } from '@/shared/protocol/game-state';
import { EMPTY_PERMISSIONS } from '@/shared/protocol/permissions';
import { WalkingAnimationVariant, type AnimationInstruction, type MoveAnimation } from '@/shared/protocol/animation';
import type { ActiveCard } from '@/shared/protocol/game-state';
import { CardEffectType } from '@/shared/protocol/game-state.enums';
import { getWalkSteps } from '@/shared/config/board-layout';
import { getDeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS, CARD_WALK_STEP_DURATION_MS, JAIL_CORNER_DRAG_DURATION_MS } from '@/shared/config/constants';
import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';
import { DICE_SPIN_MS, DICE_LINGER_MS } from '@/shared/config/constants';

// ─── Animation event listeners ────────────────────────────────────────────────

type AnimationListener = (instr: AnimationInstruction) => void;
const listeners = new Set<AnimationListener>();

/** Subscribe to animation instructions as they begin executing. Returns an unsubscribe fn. */
export function onAnimation(fn: AnimationListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(instr: AnimationInstruction): void {
  listeners.forEach((fn) => fn(instr));
}

// ─────────────────────────────────────────────────────────────────────────────

const BOARD_SIZE = 40;
const GO_TO_JAIL_POSITION = 30;
const JAIL_POSITION = 10;
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

function openGate(id: string, affectedPlayerId: string): Promise<void> {
  const ui = useUiStore.getState();
  ui.setPendingInteractionId(id);
  ui.setPendingAnimationInteraction({ interactionId: id, affectedPlayerId });
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
  const ui = useUiStore.getState();
  ui.setPendingInteractionId(null);
  ui.setPendingAnimationInteraction(null);
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
  closeGate(''); // force-release whatever gate is open (clears pending interaction)
  // Clear every animation-transient flag. A timeline aborted mid-flight by this reset
  // bails at its `generation` check and never reaches its own cleanup, so if we don't
  // clear here the UI stays gated — most visibly `isTimelineRunning` keeps the Roll
  // button locked forever.
  const ui = useUiStore.getState();
  ui.setIsRolling(false);
  ui.setIsTimelineRunning(false);
  ui.setWalkState(null);
  ui.setAnimatedDiceRoll(null);
  ui.setActiveAnimationCard(null);
}

async function drain(): Promise<void> {
  const myGeneration = generation;
  running = true;
  try {
    while (queue.length > 0 && generation === myGeneration) {
      const next = queue.shift()!;
      await applyTimeline(next, myGeneration);
    }
  } finally {
    // Always release the running latch for the current generation, even if a frame threw.
    if (generation === myGeneration) running = false;
  }
}

/**
 * Fallback animation: when a frame ships without an `animationTimeline` (the
 * backend may omit it), synthesize one by diffing the previously-committed state
 * against this frame — so token movement still glides instead of teleporting.
 * Mirrors what the /debug scenarios do from hardcoded scripts.
 */
function inferTimeline(prev: GameState, next: GameState): AnimationInstruction[] {
  // Need a prior frame from the same ongoing game to diff against.
  if (!prev.gameId || prev.gameId !== next.gameId || prev.players.length === 0) return [];

  const instructions: AnimationInstruction[] = [];

  // A fresh dice value → tumble the dice before the move.
  const pd = prev.turn.diceRoll;
  const nd = next.turn.diceRoll;
  if (nd && (!pd || pd.die1 !== nd.die1 || pd.die2 !== nd.die2)) {
    instructions.push({
      type: 'roll_dice',
      playerId: next.turn.currentPlayerId,
      die1: nd.die1,
      die2: nd.die2,
      isDoubles: nd.isDoubles,
    });
  }

  // Any player whose tile changed walks from → to.
  const prevById = new Map(prev.players.map((p) => [p.id, p]));
  for (const np of next.players) {
    const op = prevById.get(np.id);
    if (!op || op.position === np.position || np.isBankrupt) continue;
    const sentToJail = op.jailStatus == null && np.jailStatus != null && np.position === JAIL_POSITION;
    instructions.push({
      type: 'move',
      playerId: np.id,
      fromPosition: op.position,
      toPosition: np.position,
      speed: 'normal',
      reason: sentToJail ? 'jail' : 'dice',
    });
  }

  return instructions;
}

async function applyTimeline(next: GameSnapshot, myGeneration: number): Promise<void> {
  const ui = useUiStore.getState();
  let timeline = next.animationTimeline;

  // No server-authored timeline → infer one from the state diff so movement animates.
  if (timeline.length === 0) {
    timeline = inferTimeline(useGameStore.getState().snapshot.game, next.game);
  }

  // Nothing to replay (buy/build/reconnect/system frames) → commit immediately.
  if (timeline.length === 0) {
    commit(next);
    maybeSurfaceDeed(next);
    return;
  }

  ui.setIsTimelineRunning(true);

  try {
  const hasCard = timeline.some((i) => i.type === 'show_card');
  const timelineCard = timeline.find((instruction) => instruction.type === 'show_card')?.card ?? next.game.activeCard ?? null;
  // Track the moving player's last position so show_card can be committed spatially.
  let lastMover = next.game.turn.currentPlayerId;
  let lastPos: number | null = null;

  for (const instr of timeline) {
    if (generation !== myGeneration) return;

    switch (instr.type) {
      case 'roll_dice':
        emit(instr);
        ui.setAnimatedDiceRoll({ die1: instr.die1, die2: instr.die2, isDoubles: instr.isDoubles });
        ui.bumpAnimatedDiceRollId();
        ui.setIsRolling(true);
        await delay(DICE_SPIN_MS + DICE_LINGER_MS);
        // Do NOT clear animatedDiceRoll here — game store hasn't committed yet.
        // Clearing now would make diceRoll fall back to stale game.turn.diceRoll,
        // causing DiceWindow to re-animate with wrong values.
        ui.setIsRolling(false);
        break;

      case 'move': {
        emit(instr);
        const movementPlan = createMovementPlan(instr.fromPosition, instr.toPosition, instr.reason, instr.speed, timelineCard);
        ui.setWalkState({ playerId: instr.playerId, currentPos: instr.fromPosition, variant: movementPlan.initialVariant });
        await walkSteps(instr.playerId, movementPlan.steps, movementPlan.stepMs, movementPlan.stepVariant);
        if (movementPlan.dragToPosition !== null) {
          ui.setWalkState({
            playerId: instr.playerId,
            currentPos: movementPlan.dragToPosition,
            variant: WalkingAnimationVariant.DRAG,
          });
          await delay(JAIL_CORNER_DRAG_DURATION_MS);
        }
        ui.setWalkState(null);
        ui.setIsRolling(false);
        lastMover = instr.playerId;
        lastPos = instr.toPosition;
        break;
      }

      case 'show_card':
        emit(instr);
        ui.setActiveAnimationCard(instr.card);
        // Commit a patched snapshot: the mover stands on the card square with the card
        // visible, so the overlay makes spatial sense while we wait.
        commit(patchForCard(next, lastMover, lastPos, instr.card));
        break;

      case 'wait_for_player':
        emit(instr);
        await openGate(instr.interactionId, lastMover);
        ui.setActiveAnimationCard(null);
        break;

      case 'open_deed':
        emit(instr);
        ui.setSelectedTile(instr.position);
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
  // Clear the animated dice roll only after commit so game.turn.diceRoll already holds
  // the correct values — die1/die2 stay the same, DiceWindow never re-triggers.
  ui.setAnimatedDiceRoll(null);
  maybeSurfaceDeed(next);
  } finally {
    // Release the timeline lock on any exit path (normal end, generation bail, or a
    // throwing instruction) — but only if this generation still owns it, so we never
    // unlock a newer timeline that started after a reset.
    if (generation === myGeneration) ui.setIsTimelineRunning(false);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Step path from→to. Forward by default; backward only for short-form inferred reverse moves. */
function walkPath(from: number, to: number): number[] {
  const forward = getWalkSteps(from, to);
  if (forward.length <= MAX_FORWARD_STEPS) return forward;
  return getBackwardWalkSteps(from, to);
}

function getBackwardWalkSteps(from: number, to: number): number[] {
  const steps: number[] = [];
  let p = from;
  while (p !== to) {
    p = (p - 1 + BOARD_SIZE) % BOARD_SIZE;
    steps.push(p);
  }
  return steps;
}

interface MovementPlan {
  steps: number[];
  stepMs: number;
  stepVariant: WalkingAnimationVariant;
  initialVariant: WalkingAnimationVariant;
  dragToPosition: number | null;
}

function createMovementPlan(
  from: number,
  to: number,
  reason: MoveAnimation['reason'],
  speed: MoveAnimation['speed'],
  activeCard: ActiveCard | null,
): MovementPlan {
  const isFast = speed === 'fast';
  const stepVariant = isFast ? WalkingAnimationVariant.FAST : WalkingAnimationVariant.NORMAL;
  const stepMs = isFast ? CARD_WALK_STEP_DURATION_MS : WALK_STEP_DURATION_MS;

  if (reason === 'jail') {
    return {
      steps: from === GO_TO_JAIL_POSITION ? [] : getWalkSteps(from, GO_TO_JAIL_POSITION),
      stepMs,
      stepVariant,
      initialVariant: stepVariant,
      dragToPosition: JAIL_POSITION,
    };
  }

  if (reason === 'card') {
    const shouldWalkBackward = activeCard?.effect.type === CardEffectType.GO_BACK;
    return {
      steps: shouldWalkBackward ? getBackwardWalkSteps(from, to) : getWalkSteps(from, to),
      stepMs,
      stepVariant,
      initialVariant: stepVariant,
      dragToPosition: null,
    };
  }

  return {
    steps: walkPath(from, to),
    stepMs,
    stepVariant,
    initialVariant: stepVariant,
    dragToPosition: null,
  };
}

function patchForCard(
  snapshot: GameSnapshot,
  playerId: string,
  position: number | null,
  card: ActiveCard,
): GameSnapshot {
  return {
    ...snapshot,
    // Blank all permissions while the card gate is open — no UI action should be
    // available until the player acknowledges and the final state commits.
    permissions: EMPTY_PERMISSIONS,
    game: {
      ...snapshot.game,
      activeCard: card,
      // Zero out any pending buy so DeedWindow doesn't surface a buy decision
      // for the post-card landing tile while the card is still being displayed.
      turn: { ...snapshot.game.turn, pendingBuyPosition: null },
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

function walkSteps(
  playerId: string,
  steps: number[],
  stepMs: number,
  variant: WalkingAnimationVariant,
): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const step = () => {
      if (i >= steps.length) return resolve();
      useUiStore.getState().setWalkState({ playerId, currentPos: steps[i++], variant });
      setTimeout(step, stepMs);
    };
    setTimeout(step, 80);
  });
}

function commit(snapshot: GameSnapshot): void {
  useGameStore.getState().setSnapshot(snapshot);
}
