import type { ActiveCard } from './game-state';

export enum WalkingAnimationVariant {
  NORMAL = 'normal',
  FAST = 'fast',
  DRAG = 'drag',
}

export type MoveAnimationSpeed = 'normal' | 'fast';
export type MoveAnimationReason = 'dice' | 'card' | 'teleport' | 'jail';

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
  from: number;
  to: number;
  speed: MoveAnimationSpeed;
  reason: MoveAnimationReason;
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
