import type { ActiveCard } from '@/shared/protocol/game-state.schema';

export type CardFlipOverlayProps = {
  card: ActiveCard;
  onProceed: () => void;
  /** Whether this viewer may press Continue (the affected player). Others wait for the
   *  server's continue broadcast. Defaults to true. */
  canProceed?: boolean;
};
