import type { TradeState, TradeOffer } from '@/shared/protocol/game-state.schema';
import type { TokenColor } from '@/features/player-panel';

export type TradeParticipant = {
  id: string;
  name: string;
  token: TokenColor;
  balance: number;
  ownedPositions: number[];
};

export type TradeOfferColumnProps = {
  participant: TradeParticipant;
  offer: TradeOffer;
  label: string;
};

export type TradeWindowProps = {
  trade: TradeState;
  proposer: TradeParticipant;
  target: TradeParticipant;
  viewerId: string;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
};
