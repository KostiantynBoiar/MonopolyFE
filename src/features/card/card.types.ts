import type { ActiveCard } from '@/shared/protocol/game-state.schema';

export type CardFlipOverlayProps = {
  card: ActiveCard;
  onProceed: () => void;
};
