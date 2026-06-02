import { useGameStore } from '@/stores/game-store';
import { useUiStore } from '@/stores/ui-store';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { AnimationInstruction, MoveAnimation } from '@/shared/protocol/animations';
import {
  CARD_WALK_STEP_DURATION_MS,
  WALK_STEP_DURATION_MS,
} from '@/shared/config/constants';
import { playSfx } from '@/shared/lib/sfx';

const BOARD_SIZE = 40;
const DICE_ANIMATION_MS = 820;

let queue: GameSnapshot[] = [];
let running = false;
let runToken = 0;
let pendingWait: {
  interactionId: string;
  resolve: () => void;
} | null = null;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isActiveRun(token: number) {
  return token === runToken;
}

function clearAnimationOverlays() {
  const ui = useUiStore.getState();
  ui.setIsRolling(false);
  ui.setWalkState(null);
  ui.setActiveAnimationCard(null);
  ui.setPendingAnimationInteraction(null);
}

function getMoveStepDuration(instruction: MoveAnimation) {
  return instruction.speed === 'fast'
    ? CARD_WALK_STEP_DURATION_MS
    : WALK_STEP_DURATION_MS;
}

function getMovePath(instruction: MoveAnimation): number[] {
  const from = normalizePosition(instruction.from);
  const to = normalizePosition(instruction.to);

  if (from === to) return [];
  if (instruction.reason === 'teleport' || instruction.reason === 'jail') return [to];

  const path: number[] = [];
  let current = from;

  for (let guard = 0; guard < BOARD_SIZE; guard += 1) {
    current = (current + 1) % BOARD_SIZE;
    path.push(current);
    if (current === to) break;
  }

  return path;
}

function normalizePosition(position: number) {
  return ((position % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

async function runRollDice(instruction: Extract<AnimationInstruction, { type: 'roll_dice' }>, token: number) {
  const ui = useUiStore.getState();
  ui.setAnimatedDiceRoll({
    die1: instruction.die1,
    die2: instruction.die2,
    isDoubles: instruction.isDoubles,
  });
  ui.bumpAnimatedDiceRollId();
  ui.setIsRolling(true);
  playSfx('dice_roll');

  await delay(DICE_ANIMATION_MS);
  if (!isActiveRun(token)) return;
  useUiStore.getState().setIsRolling(false);
}

async function runMove(instruction: MoveAnimation, token: number) {
  const duration = getMoveStepDuration(instruction);
  const fast = instruction.speed === 'fast';
  const from = normalizePosition(instruction.from);
  const path = getMovePath(instruction);
  const ui = useUiStore.getState();

  ui.setWalkState({ playerId: instruction.playerId, currentPos: from, fast });
  await delay(20);
  if (!isActiveRun(token)) return;

  for (const position of path) {
    useUiStore.getState().setWalkState({
      playerId: instruction.playerId,
      currentPos: position,
      fast,
    });
    await delay(duration);
    if (!isActiveRun(token)) return;
  }

  useUiStore.getState().setWalkState(null);
}

async function runWaitForPlayer(
  instruction: Extract<AnimationInstruction, { type: 'wait_for_player' }>,
  affectedPlayerId: string,
  token: number,
) {
  useUiStore.getState().setPendingAnimationInteraction({
    interactionId: instruction.interactionId,
    affectedPlayerId,
  });

  await new Promise<void>((resolve) => {
    pendingWait = { interactionId: instruction.interactionId, resolve };
  });

  if (!isActiveRun(token)) return;
  pendingWait = null;
  const ui = useUiStore.getState();
  ui.setPendingAnimationInteraction(null);
  ui.setActiveAnimationCard(null);
}

async function runInstruction(
  instruction: AnimationInstruction,
  token: number,
  context: { affectedPlayerId: string },
) {
  switch (instruction.type) {
    case 'roll_dice':
      await runRollDice(instruction, token);
      break;

    case 'move':
      await runMove(instruction, token);
      break;

    case 'show_card':
      context.affectedPlayerId = instruction.card.drawerId;
      useUiStore.getState().setActiveAnimationCard(instruction.card);
      break;

    case 'wait_for_player':
      await runWaitForPlayer(instruction, context.affectedPlayerId, token);
      break;

    case 'open_deed':
      break;

    default:
      break;
  }

}

async function processQueue(token: number) {
  while (queue.length > 0 && isActiveRun(token)) {
    const snapshot = queue.shift();
    if (!snapshot) continue;

    useGameStore.getState().setSnapshot(snapshot);
    clearAnimationOverlays();

    if (snapshot.animationTimeline.length === 0) {
      continue;
    }

    useUiStore.getState().setIsTimelineRunning(true);
    const context = { affectedPlayerId: snapshot.game.turn.currentPlayerId };

    for (const instruction of snapshot.animationTimeline) {
      await runInstruction(instruction, token, context);
      if (!isActiveRun(token)) return;
    }

    clearAnimationOverlays();
  }

  if (!isActiveRun(token)) return;
  running = false;
  useUiStore.getState().setIsTimelineRunning(false);
}

export function enqueueSnapshot(snapshot: GameSnapshot) {
  queue.push(snapshot);
  if (running) return;

  running = true;
  const token = runToken;
  void processQueue(token);
}

export function continueAnimationInteraction(interactionId: string) {
  if (pendingWait?.interactionId !== interactionId) return;

  const resolve = pendingWait.resolve;
  pendingWait = null;
  const ui = useUiStore.getState();
  ui.setPendingAnimationInteraction(null);
  ui.setActiveAnimationCard(null);
  resolve();
}

export function resetSnapshotPipeline() {
  runToken += 1;
  queue = [];
  running = false;
  pendingWait?.resolve();
  pendingWait = null;
  useUiStore.getState().reset();
}
