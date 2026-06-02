export { CardKind, CardEffectType } from '@/shared/protocol/game-state.enums';

export enum CardFlipState {
  IDLE      = 'idle',
  FLIPPING  = 'flipping',
  REVEALED  = 'revealed',
}
