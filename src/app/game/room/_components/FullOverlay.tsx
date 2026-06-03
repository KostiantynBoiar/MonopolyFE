'use client';

import { ManagePropertiesOverlay, type ManageProperty } from '@/features/manage';
import { TradeBuilder, type TradeAsset, type TradePlayer } from '@/features/trade/components/TradeBuilder';
import { TradeOverlay } from '@/features/trade/components/TradeOverlay';
import type { TradeParticipant } from '@/features/trade/trade.types';
import type { TradeOffer, TradeState } from '@/shared/protocol/game-state';
import { TradeStatus } from '@/shared/protocol/game-state.enums';

export type ActiveOverlay = 'manage' | 'trade-builder' | null;

export interface TradeBuilderData {
  me: TradePlayer;
  others: TradePlayer[];
  myProperties: TradeAsset[];
  myJailCards: number;
  propertiesOf: (playerId: string) => TradeAsset[];
  jailCardsOf: (playerId: string) => number;
}

export interface FullOverlayProps {
  trade: TradeState | null;
  tradeProposer: TradeParticipant | null;
  tradeTarget: TradeParticipant | null;
  viewerPlayerId: string | null;
  activeOverlay: ActiveOverlay;
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
  onTradePropose: (targetId: string, offer: TradeOffer, request: TradeOffer) => void;
}

export function FullOverlay({
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
  onTradePropose,
}: FullOverlayProps) {
  if (trade && trade.status === TradeStatus.PENDING && tradeProposer && tradeTarget) {
    return (
      <TradeOverlay
        trade={trade}
        proposer={tradeProposer}
        target={tradeTarget}
        viewerId={viewerPlayerId ?? ''}
        onAccept={onTradeAccept}
        onReject={onTradeReject}
        onCancel={onTradeCancel}
      />
    );
  }

  if (activeOverlay === 'manage') {
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

  if (activeOverlay === 'trade-builder' && tradeBuilderData) {
    return (
      <TradeBuilder
        me={tradeBuilderData.me}
        others={tradeBuilderData.others}
        myProperties={tradeBuilderData.myProperties}
        myJailCards={tradeBuilderData.myJailCards}
        propertiesOf={tradeBuilderData.propertiesOf}
        jailCardsOf={tradeBuilderData.jailCardsOf}
        onPropose={(targetId, offer, request) => {
          onTradePropose(targetId, offer, request);
          onCloseOverlay();
        }}
        onClose={onCloseOverlay}
      />
    );
  }

  return null;
}
