import type { TradeState, TradeOffer } from '@/shared/protocol/game-state';
import type { TokenColor } from '@/shared/protocol/game-state.enums';

export interface TradeParticipant {
  id: string;
  name: string;
  token: TokenColor;
  balance: number;
  ownedPositions: number[];
}

export interface TradeOfferColumnProps {
  participant: TradeParticipant;
  offer: TradeOffer;
  label: string;
}

export interface TradeWindowProps {
  trade: TradeState;
  proposer: TradeParticipant;
  target: TradeParticipant;
  viewerId: string;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  onCancel?: () => void;
}
