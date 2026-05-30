import type { AuctionState } from '@/shared/protocol/game-state.schema';

export type AuctionPlayer = {
  id: string;
  name: string;
};

export type AuctionPanelProps = {
  auctionState: AuctionState;
  propertyName: string;
  viewerId: string;
  players: AuctionPlayer[];
  canBid: boolean;            // from server permissions (actionsAvailable.canBid)
  onBid: (amount: number) => void;
};
