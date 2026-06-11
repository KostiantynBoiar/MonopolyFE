'use client';

import { useState } from 'react';
import { CardFlipOverlay } from '@/features/card/components/CardFlipOverlay';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board/game-board.types';
import { GameMode } from '@/shared/protocol/game-state.enums';
import type { Player } from '@/features/player-panel/player-panel.schema';
import type { PropertyState } from '@/shared/protocol/game-state';
import type { BoardTileSelectionTone } from '@/features/game-board/game-board.enums';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { CenterPanel } from '../CenterPanel';
import { FullOverlay } from '../FullOverlay';
import type { GameCenterGridProps } from '../GameCenterGrid';
import { MobileHeader } from './MobileHeader';
import { MobilePlayersSheet } from './MobilePlayersSheet';
import { MobileBoardStrip } from './MobileBoardStrip';
import { MobileActionRow } from './MobileActionRow';
import { MobileControlRow } from './MobileControlRow';

interface MobileBoardData {
  spaces: PropertyState[];
  players: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
  sidebarPlayers: Player[];
  selectedPosition: number | null;
  tileSelectionTones?: Partial<Record<number, BoardTileSelectionTone>>;
  focusPositions?: Set<number> | null;
  onSelectPosition: (pos: number) => void;
  viewerId?: string;
  createdAt?: string;
  gameMode?: GameMode;
}

export type MobileGameRoomProps = GameCenterGridProps & MobileBoardData;

export function MobileGameRoom({
  // Board data
  spaces,
  players,
  walkingPlayers,
  sidebarPlayers,
  selectedPosition,
  tileSelectionTones,
  focusPositions,
  onSelectPosition,
  viewerId,
  createdAt,
  gameMode,
  // GameCenterGrid props
  isBuyDecisionForViewer,
  animatedDiceRollId,
  deedPanelSpace,
  pendingBuySpace,
  canRoll,
  canBuyProperty,
  canManage,
  canEndTurn,
  canTrade,
  hasOtherTraders,
  isViewerTurn,
  roundNumber,
  turnDeadlineMs,
  canSurrender,
  isRolling,
  onRoll,
  onEndTurn,
  onManageOpen,
  onTradeOpen,
  onBuy,
  onAuction,
  onSurrender,
  // Card overlay
  activeCard,
  pendingInteractionPlayerId,
  onCardProceed,
  // CenterPanel props
  viewerPlayerId,
  debt,
  auction,
  auctionPlayers,
  turnPhase,
  jailStatus,
  diceRoll,
  canPayDebt,
  canBidAuction,
  canRollInJail,
  canPayJailFine,
  canUseJailCard,
  log,
  chatMessages,
  viewerToken,
  viewerUserId,
  onPayDebt,
  onManage,
  onBankrupt,
  onBidAuction,
  onPayJailFine,
  onUseJailCard,
  onSendMessage,
  onSendSticker,
  // FullOverlay props
  trade,
  tradeProposer,
  tradeTarget,
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
}: MobileGameRoomProps) {
  const [playersOpen, setPlayersOpen] = useState(false);

  return (
    <div
      className="flex h-[100dvh] w-full flex-col gap-2 overflow-hidden p-2"
      style={{
        backgroundColor: GAME_BOARD_COLORS.ink,
        paddingTop: 'max(8px, env(safe-area-inset-top))',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(8px, env(safe-area-inset-left))',
        paddingRight: 'max(8px, env(safe-area-inset-right))',
      }}
    >
      <MobileHeader
        players={sidebarPlayers}
        viewerId={viewerId}
        onOpenPlayers={() => setPlayersOpen(true)}
      />

      <MobileBoardStrip
        spaces={spaces}
        players={players}
        walkingPlayers={walkingPlayers}
        selectedPosition={selectedPosition}
        tileSelectionTones={tileSelectionTones}
        focusPositions={focusPositions}
        onSelectPosition={onSelectPosition}
        gameMode={gameMode}
      />

      {/* Content area below the board strip. position:relative so overlays (trade, manage, card) are
          anchored here — they cover this section while leaving the board strip visible. */}
      <div className="relative min-h-0 flex-1 flex flex-col gap-2">
        {/* Cards row — capped so chat always gets at least ~96px (tabs + composer). */}
        <div className="shrink-0" style={{ height: 'clamp(110px, 23dvh, 200px)' }}>
          <MobileActionRow
            diceRoll={diceRoll}
            animatedDiceRollId={animatedDiceRollId}
            canRoll={canRoll}
            canEndTurn={canEndTurn}
            isRolling={isRolling}
            isBuyDecisionForViewer={isBuyDecisionForViewer}
            deedPanelSpace={deedPanelSpace}
            pendingBuySpace={pendingBuySpace}
            canBuyProperty={canBuyProperty}
            onRoll={onRoll}
            onEndTurn={onEndTurn}
            onBuy={onBuy}
            onAuction={onAuction}
          />
        </div>

        <MobileControlRow
          canManage={canManage}
          canTrade={canTrade}
          hasOtherTraders={hasOtherTraders}
          isViewerTurn={isViewerTurn}
          roundNumber={roundNumber}
          turnDeadlineMs={turnDeadlineMs}
          canSurrender={canSurrender}
          onManageOpen={onManageOpen}
          onTradeOpen={onTradeOpen}
          onSurrender={onSurrender}
        />

        {/* Chat / prompts — fills remaining space; min-height ensures the composer row (48px)
            and tabs (~44px) are never squashed to zero on small phones. */}
        <div className="relative flex-1" style={{ minHeight: '98px' }}>
          <CenterPanel
            viewerPlayerId={viewerPlayerId}
            debt={debt}
            auction={auction}
            auctionPlayers={auctionPlayers}
            turnPhase={turnPhase}
            jailStatus={jailStatus}
            diceRoll={diceRoll}
            isRolling={isRolling}
            canPayDebt={canPayDebt}
            canBidAuction={canBidAuction}
            canRollInJail={canRollInJail}
            canPayJailFine={canPayJailFine}
            canUseJailCard={canUseJailCard}
            log={log}
            chatMessages={chatMessages}
            viewerToken={viewerToken}
            viewerUserId={viewerUserId}
            onPayDebt={onPayDebt}
            onManage={onManage}
            onBankrupt={onBankrupt}
            onBidAuction={onBidAuction}
            onPayJailFine={onPayJailFine}
            onUseJailCard={onUseJailCard}
            onRoll={onRoll}
            onSurrender={isViewerTurn && canSurrender ? onSurrender : undefined}
            onSendMessage={onSendMessage}
            onSendSticker={onSendSticker}
          />
        </div>

        {/* Drawn card overlay — covers the content area; board strip stays visible above. */}
        {activeCard && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(20,16,12,0.55)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <CardFlipOverlay
              card={activeCard}
              onProceed={onCardProceed}
              canProceed={pendingInteractionPlayerId !== null && pendingInteractionPlayerId === viewerPlayerId}
            />
          </div>
        )}

        {/* Trade/manage overlays — absolute inset-[6px] within this container, board strip stays visible. */}
        <FullOverlay
          compact
          trade={trade}
          tradeProposer={tradeProposer}
          tradeTarget={tradeTarget}
          viewerPlayerId={viewerPlayerId}
          activeOverlay={activeOverlay}
          manageProperties={manageProperties}
          canBuildHouse={canBuildHouse}
          canBuildHotel={canBuildHotel}
          canMortgage={canMortgage}
          canUnmortgage={canUnmortgage}
          tradeBuilderData={tradeBuilderData}
          onTradeAccept={onTradeAccept}
          onTradeReject={onTradeReject}
          onTradeCancel={onTradeCancel}
          onBuildHouse={onBuildHouse}
          onBuildHotel={onBuildHotel}
          onSellHouse={onSellHouse}
          onSellHotel={onSellHotel}
          onMortgage={onMortgage}
          onUnmortgage={onUnmortgage}
          onSellProperty={onSellProperty}
          onCloseOverlay={onCloseOverlay}
          onTradeGiveMoneyChange={onTradeGiveMoneyChange}
          onTradeGetMoneyChange={onTradeGetMoneyChange}
          onTradeGiveCardsChange={onTradeGiveCardsChange}
          onTradeGetCardsChange={onTradeGetCardsChange}
          onTradeClearOfferAssets={onTradeClearOfferAssets}
          onTradeClearRequestAssets={onTradeClearRequestAssets}
          onTradePropose={onTradePropose}
        />
      </div>

      <MobilePlayersSheet
        open={playersOpen}
        onClose={() => setPlayersOpen(false)}
        players={sidebarPlayers}
        log={log}
        viewerId={viewerId}
        createdAt={createdAt}
        onSurrender={onSurrender}
      />
    </div>
  );
}
