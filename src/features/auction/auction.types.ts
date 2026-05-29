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
  onBid: (amount: number) => void;
};
