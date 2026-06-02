/**
 * Backend-authored animation timeline (camelCase, frontend-facing).
 *
 * The backend emits an ordered list of these alongside each authoritative game.state
 * frame; the timeline-executor replays them sequentially. The frontend no longer infers
 * animations by diffing snapshots.
 */
import type { ActiveCard } from './game-state';

export type RollDiceAnimation = {
  type: 'roll_dice';
  playerId: string;
  die1: number;
  die2: number;
  isDoubles: boolean;
};

export type MoveAnimation = {
  type: 'move';
  playerId: string;
  fromPosition: number;
  toPosition: number;
  speed: 'normal' | 'fast';
  reason: 'dice' | 'card' | 'teleport' | 'jail';
};

export type ShowCardAnimation = {
  type: 'show_card';
  card: ActiveCard;
};

export type WaitForPlayerAnimation = {
  type: 'wait_for_player';
  interactionId: string;
};

export type OpenDeedAnimation = {
  type: 'open_deed';
  position: number;
};

export type AnimationInstruction =
  | RollDiceAnimation
  | MoveAnimation
  | ShowCardAnimation
  | WaitForPlayerAnimation
  | OpenDeedAnimation;
