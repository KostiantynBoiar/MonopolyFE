/**
 * Snapshot animation pipeline.
 *
 * Frames are processed through a serial queue so a burst of snapshots (e.g. roll
 * then auto-advance) animates in order instead of overlapping.
 *
 * Two card-move flows are supported:
 *
 *   Two-frame (BE sends card-square frame then destination frame separately):
 *     Frame 1 → walk to card square → commit (card visible) → gate
 *     Frame 2 → card walk to destination → commit (card gone)
 *
 *   Single-frame (BE has already applied the card effect; player.position = destination):
 *     Frame 1 → walk to card square → commit patched (player at square, card visible) →
 *               gate → walk to destination → commit final (card cleared)
 */

import type { GameSnapshot } from '@/shared/protocol/permissions';
import { getWalkSteps } from '@/shared/config/board-layout';
import { getDeedInfo } from '@/features/deed';
import { WALK_STEP_DURATION_MS, CARD_WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';

const BOARD_SIZE = 40;
const DICE_SPIN_MS = 1000;
// Forward path length above which we treat a move as backward (snap, no walk).
const MAX_FORWARD_STEPS = 20;
// Safety auto-release for the card gate if the player never clicks Proceed.
const CARD_GATE_TIMEOUT_MS = 60_000;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let queue: GameSnapshot[] = [];
let running = false;
// Incremented on reset; each drain() captures its own value and bails if it goes stale.
let generation = 0;

// Whether the last *committed* snapshot contained an activeCard. Tracked separately
// from the store so updateGame({ activeCard: null }) from the Proceed handler doesn't
// confuse the next frame's cardResolved detection.
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
  generation++;       // invalidates any in-flight drain() coroutine
  queue = [];
  running = false;
  prevCommittedHadCard = false;
  resolveCardGate();
}

async function drain(): Promise<void> {
  const myGeneration = generation;
  running = true;
  while (queue.length > 0 && generation === myGeneration) {
    const next = queue.shift()!;
    await applyFrame(next, myGeneration);
  }
  if (generation === myGeneration) running = false;
}

async function applyFrame(next: GameSnapshot, myGeneration: number): Promise<void> {
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

  // Where the dice would have landed (ignoring any card-driven displacement).
  const diceSquare =
    sum !== null && oldPos !== null ? (oldPos + sum) % BOARD_SIZE : null;

  // ── Move classifications ──────────────────────────────────────────────────────

  // Normal dice walk: player ends up exactly at the dice square (no card, or card
  // square is the final position because BE sends it separately in a second frame).
  const walked =
    oldPos !== null &&
    newPos !== null &&
    oldPos !== newPos &&
    diceSquare !== null &&
    diceSquare === newPos &&
    !sentToJail;

  // Card-resolved walk (two-frame flow): the previous committed frame had a card,
  // this one clears it — animate from old position to the card's destination.
  const cardResolved = prevCommittedHadCard && !next.game.activeCard;
  const cardSteps =
    cardResolved && oldPos !== null && newPos !== null && oldPos !== newPos && !sentToJail
      ? getWalkSteps(oldPos, newPos)
      : null;
  const cardMoved = cardSteps !== null && cardSteps.length <= MAX_FORWARD_STEPS;

  // Direct card move (single-frame flow): the BE applied the card effect in the same
  // frame as the roll, so player.position is already the destination, not the card
  // square. diceSquare points at the card square the player physically stepped on.
  const directCardSquare =
    !walked &&
    diceChanged &&
    diceSquare !== null &&
    newPos !== null &&
    diceSquare !== newPos &&
    !!next.game.activeCard &&
    !sentToJail
      ? diceSquare
      : null;

  // ── Fast path: nothing to animate ────────────────────────────────────────────
  if (!diceChanged && !walked && !cardMoved && directCardSquare === null) {
    if (generation !== myGeneration) return;
    commit(next);
    // Still check for a pending buy — the backend may set pending_buy_position in a
    // separate frame from the movement frame (e.g. on a doubles roll).
    maybeSurfaceDeed(next);
    return;
  }

  // ── Phase 1: Dice spin ────────────────────────────────────────────────────────
  if (diceChanged) {
    ui.setIsRolling(true);
    await delay(DICE_SPIN_MS);
    ui.setIsRolling(false);
  }

  // ── Phase 2a: Normal dice walk ────────────────────────────────────────────────
  if (walked && oldPos !== null && newPos !== null) {
    const steps = getWalkSteps(oldPos, newPos);
    ui.setWalkState({ playerId: moverId, currentPos: oldPos });
    await walkSteps(moverId, steps, WALK_STEP_DURATION_MS, false);
    ui.setWalkState(null);
    // Clear rolling lock in case diceChanged was false (same dice result) and
    // Phase 1 was skipped, leaving the optimistic isRolling=true from dispatch.
    ui.setIsRolling(false);
  }

  // ── Phase 2b: Direct card move ────────────────────────────────────────────────
  // Single-frame: walk to card square → show card → wait for consent → walk to dest.
  if (directCardSquare !== null && oldPos !== null && newPos !== null) {
    // Step 1: walk to the card square the dice pointed at.
    const toCardSteps = getWalkSteps(oldPos, directCardSquare);
    ui.setWalkState({ playerId: moverId, currentPos: oldPos });
    await walkSteps(moverId, toCardSteps, WALK_STEP_DURATION_MS, false);
    ui.setWalkState(null);

    // Step 2: commit a patched snapshot showing the player standing on the card
    // square (not the destination) so the card overlay makes spatial sense.
    commit(patchMoverPosition(next, moverId, directCardSquare));
    // prevCommittedHadCard is now true (patched snapshot still has activeCard).

    // Step 3: wait for the player to acknowledge the card.
    await waitForCardProceed();
    // handleCardProceed already called updateGame({ activeCard: null }), which
    // cleared the card from the store. We now animate the card-driven displacement.

    // Step 4: walk from the card square to the final destination.
    const toDestSteps = getWalkSteps(directCardSquare, newPos);
    ui.setWalkState({ playerId: moverId, currentPos: directCardSquare });
    await walkSteps(moverId, toDestSteps, CARD_WALK_STEP_DURATION_MS, true);
    ui.setWalkState(null);

    // Step 5: commit the authoritative snapshot with the card cleared.
    if (generation !== myGeneration) return;
    prevCommittedHadCard = false;
    useGameStore.getState().setSnapshot({ ...next, game: { ...next.game, activeCard: null } });

    maybeSurfaceDeed(next);
    return;
  }

  // ── Phase 3: Card-driven walk (two-frame flow) ────────────────────────────────
  if (cardMoved && cardSteps && oldPos !== null) {
    ui.setWalkState({ playerId: moverId, currentPos: oldPos });
    await walkSteps(moverId, cardSteps, CARD_WALK_STEP_DURATION_MS, true);
    ui.setWalkState(null);
  }

  // ── Phase 4: Commit ───────────────────────────────────────────────────────────
  if (generation !== myGeneration) return;
  commit(next);
  maybeSurfaceDeed(next);

  // ── Phase 5: Card gate (two-frame flow — pause until Proceed) ────────────────
  if (next.game.activeCard !== null) {
    await waitForCardProceed();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function patchMoverPosition(
  snapshot: GameSnapshot,
  playerId: string,
  position: number,
): GameSnapshot {
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      players: snapshot.game.players.map((p) =>
        p.id === playerId ? { ...p, position } : p,
      ),
    },
  };
}

function maybeSurfaceDeed(snapshot: GameSnapshot): void {
  const pendingPos = snapshot.game.turn.pendingBuyPosition;
  const viewerId = snapshot.game.viewerId;
  // Treat absent/empty viewerId as "is the current player" — mirrors derivePermissions.
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
  prevCommittedHadCard = !!snapshot.game.activeCard;
  useGameStore.getState().setSnapshot(snapshot);
}
