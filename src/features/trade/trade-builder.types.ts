import type { PropertyColor } from '@/shared/protocol/game-state.enums';

export type TradePlayer = { id: string; name: string; balance: number; getOutOfJailCards: number };
export type TradeCounterparty = TradePlayer & { getOutOfJailCards: number; propertyCount: number };
export type TradeAsset = { position: number; color?: PropertyColor };

export type TradeBuilderProps = {
  me: TradePlayer;
  others: TradeCounterparty[];
  target: TradeCounterparty | null;
  offerAssets: TradeAsset[];
  requestAssets: TradeAsset[];
  giveMoney: number;
  getMoney: number;
  giveCards: number;
  getCards: number;
  onGiveMoneyChange: (value: number) => void;
  onGetMoneyChange: (value: number) => void;
  onGiveCardsChange: (value: number) => void;
  onGetCardsChange: (value: number) => void;
  onClearOfferAssets: () => void;
  onClearRequestAssets: () => void;
  onPropose: () => void;
  onClose: () => void;
};
