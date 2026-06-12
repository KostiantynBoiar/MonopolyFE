'use client';

import {
  ManagePropertiesOverlay,
  type ManageProperty,
} from '@/features/manage-overlay/ManagePropertiesOverlay';
import { TradeBuilder } from '@/features/trade-overlay/components/TradeBuilder';
import { MobileTradeBuilder } from '@/features/trade-overlay/components/MobileTradeBuilder';
import { TradeOverlay } from '@/features/trade-overlay/components/TradeOverlay';
import type { TradeAsset, TradeCounterparty, TradePlayer } from '@/features/trade-overlay/trade-builder.types';
import type { TradeParticipant } from '@/features/trade-overlay/trade.types';
import type { TradeState } from '@/shared/protocol/game-state';
import { TradeStatus } from '@/shared/protocol/game-state.enums';

export enum ActiveOverlay {
  MANAGE = 'manage',
  TRADE_BUILDER = 'trade_builder',
}

export interface TradeBuilderData {
  me: TradePlayer;
  others: TradeCounterparty[];
  target: TradeCounterparty | null;
  offerAssets: TradeAsset[];
  requestAssets: TradeAsset[];
  giveMoney: number;
  getMoney: number;
  giveCards: number;
  getCards: number;
}

export interface FullOverlayProps {
  compact?: boolean;
  trade: TradeState | null;
  tradeProposer: TradeParticipant | null;
  tradeTarget: TradeParticipant | null;
  viewerPlayerId: string | null;
  activeOverlay: ActiveOverlay | null;
  manageProperties: ManageProperty[];
  canBuildHouse: boolean;
  canBuildHotel: boolean;
  canMortgage: boolean;
  canUnmortgage: boolean;
  tradeBuilderData: TradeBuilderData | null;
  onTradeAccept: () => void;
  onTradeReject: () => void;
  onTradeCancel: () => void;
  onBuildHouse: (position: number) => void;
  onBuildHotel: (position: number) => void;
  onSellHouse: (position: number) => void;
  onSellHotel: (position: number) => void;
  onMortgage: (position: number) => void;
  onUnmortgage: (position: number) => void;
  onSellProperty: (position: number) => void;
  onCloseOverlay: () => void;
  onTradeGiveMoneyChange: (value: number) => void;
  onTradeGetMoneyChange: (value: number) => void;
  onTradeGiveCardsChange: (value: number) => void;
  onTradeGetCardsChange: (value: number) => void;
  onTradeClearOfferAssets: () => void;
  onTradeClearRequestAssets: () => void;
  onTradePropose: () => void;
}

export function FullOverlay({
  compact = false,
  trade,
  tradeProposer,
  tradeTarget,
  viewerPlayerId,
  activeOverlay,
  manageProperties,
  canBuildHouse,
  canBuildHotel,
  canMortgage,
  canUnmortgage,
  tradeBuilderData,
  onTradeAccept,
  onTradeReject,
  onTradeCancel,
  onBuildHouse,
  onBuildHotel,
  onSellHouse,
  onSellHotel,
  onMortgage,
  onUnmortgage,
  onSellProperty,
  onCloseOverlay,
  onTradeGiveMoneyChange,
  onTradeGetMoneyChange,
  onTradeGiveCardsChange,
  onTradeGetCardsChange,
  onTradeClearOfferAssets,
  onTradeClearRequestAssets,
  onTradePropose,
}: FullOverlayProps) {
  if (trade && trade.status === TradeStatus.PENDING && tradeProposer && tradeTarget) {
    return (
      <TradeOverlay
        trade={trade}
        proposer={tradeProposer}
        target={tradeTarget}
        viewerId={viewerPlayerId ?? ''}
        compact={compact}
        onAccept={onTradeAccept}
        onReject={onTradeReject}
        onCancel={onTradeCancel}
      />
    );
  }

  if (activeOverlay === ActiveOverlay.MANAGE) {
    return (
      <ManagePropertiesOverlay
        properties={manageProperties}
        canBuildHouse={canBuildHouse}
        canBuildHotel={canBuildHotel}
        canMortgage={canMortgage}
        canUnmortgage={canUnmortgage}
        onBuildHouse={onBuildHouse}
        onBuildHotel={onBuildHotel}
        onSellHouse={onSellHouse}
        onSellHotel={onSellHotel}
        onMortgage={onMortgage}
        onUnmortgage={onUnmortgage}
        onSellProperty={onSellProperty}
        onClose={onCloseOverlay}
      />
    );
  }

  if (activeOverlay === ActiveOverlay.TRADE_BUILDER && tradeBuilderData) {
    const builderProps = {
      ...tradeBuilderData,
      onGiveMoneyChange: onTradeGiveMoneyChange,
      onGetMoneyChange: onTradeGetMoneyChange,
      onGiveCardsChange: onTradeGiveCardsChange,
      onGetCardsChange: onTradeGetCardsChange,
      onClearOfferAssets: onTradeClearOfferAssets,
      onClearRequestAssets: onTradeClearRequestAssets,
      onPropose: onTradePropose,
      onClose: onCloseOverlay,
    };
    return compact ? <MobileTradeBuilder {...builderProps} /> : <TradeBuilder {...builderProps} />;
  }

  return null;
}
