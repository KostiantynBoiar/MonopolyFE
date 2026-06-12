import { WalkingAnimationVariant } from '@/shared/protocol/animation';
import { CARD_WALK_STEP_DURATION_MS, JAIL_CORNER_DRAG_DURATION_MS, WALK_STEP_DURATION_MS } from '@/shared/config/constants';

export const ANIM = {
  [WalkingAnimationVariant.NORMAL]: { easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)', duration: WALK_STEP_DURATION_MS },
  [WalkingAnimationVariant.FAST]:   { easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)', duration: CARD_WALK_STEP_DURATION_MS },
  [WalkingAnimationVariant.DRAG]:   { easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)',    duration: JAIL_CORNER_DRAG_DURATION_MS },
} as const;
