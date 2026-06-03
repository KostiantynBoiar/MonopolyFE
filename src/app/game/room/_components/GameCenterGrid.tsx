'use client';

import { useTranslations } from 'next-intl';
import { DeedWindow } from '@/features/deed';
import { DiceWindow } from '@/features/dice';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import type { DiceRoll } from '@/shared/protocol/game-state';
import { CenterPanel, type CenterPanelProps } from './CenterPanel';
import { FullOverlay, type FullOverlayProps } from './FullOverlay';

interface GameCenterGridProps extends CenterPanelProps, FullOverlayProps {
  isBuyDecisionForViewer: boolean;
  animatedDiceRollId: number;
  deedPanelSpace: BoardSpace;
  pendingBuySpace: BoardSpace | null;
  canRoll: boolean;
  canBuyProperty: boolean;
  canManage: boolean;
  canEndTurn: boolean;
  canTrade: boolean;
  hasOtherTraders: boolean;
  isViewerTurn: boolean;
  roundNumber: number;
  onEndTurn: () => void;
  onManageOpen: () => void;
  onTradeOpen: () => void;
  onBuy: () => void;
  onAuction: () => void;
}

const DISABLED_BUTTON = {
  backgroundColor: GAME_BOARD_COLORS.surface,
  borderColor: GAME_BOARD_COLORS.border,
  color: GAME_BOARD_COLORS.muted,
};

const TRANSITION = 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)';

export function GameCenterGrid({
  // Layout
  isBuyDecisionForViewer,
  animatedDiceRollId,
  deedPanelSpace,
  pendingBuySpace,
  // Button states
  canRoll,
  canBuyProperty,
  canManage,
  canEndTurn,
  canTrade,
  hasOtherTraders,
  isViewerTurn,
  roundNumber,
  isRolling,
  // Button handlers
  onRoll,
  onEndTurn,
  onManageOpen,
  onTradeOpen,
  onBuy,
  onAuction,
  // CenterPanel props
  activeCard,
  pendingInteractionPlayerId,
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
  onCardProceed,
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
  onTradePropose,
}: GameCenterGridProps) {
  const t = useTranslations('Game');

  const dimStyle = {
    opacity: isBuyDecisionForViewer ? 0.15 : 1,
    filter: isBuyDecisionForViewer ? 'saturate(0.82)' : 'saturate(1)',
    transition: 'opacity 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms cubic-bezier(0.22, 1, 0.36, 1)',
  };


  return (
    <div className="relative h-full w-full">
      <div className="grid h-full w-full grid-cols-6 grid-rows-5" style={{ gap: 'clamp(3px,0.5vmin,6px)', padding: 'clamp(3px,0.5vmin,6px)' }}>

        {/* Dice window — top-left 2×2 */}
        <div className="col-span-2 row-span-2 min-h-0" style={dimStyle}>
          <DiceWindow diceRoll={diceRoll} rollId={animatedDiceRollId} />
        </div>

        {/* Action buttons — top-right 4×2 */}
        <section
          className="col-span-4 col-start-3 row-span-2 grid min-h-0 grid-cols-3"
          style={{ ...dimStyle, gap: 'clamp(3px,0.5vmin,6px)' }}
        >
          <button
            type="button"
            onClick={onRoll}
            disabled={!canRoll}
            className="col-span-2 rounded-[12px] border px-3 font-display font-black uppercase tracking-[0.12em] disabled:cursor-not-allowed"
            style={canRoll ? {
              ...DISABLED_BUTTON,
              fontSize: 'clamp(12px,1.8vmin,20px)',
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
              backgroundColor: BOARD_TILE_COLORS.propertyGreen,
              borderColor: BOARD_TILE_COLORS.propertyGreen,
              color: BOARD_TILE_COLORS.altText,
              transition: TRANSITION,
            } : {
              ...DISABLED_BUTTON,
              fontSize: 'clamp(12px,1.8vmin,20px)',
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
            }}
          >
            {isRolling ? t('rolling') : t('roll')}
          </button>

          <button
            type="button"
            onClick={onEndTurn}
            disabled={!canEndTurn}
            className="rounded-[12px] border px-3 font-display text-sm font-black uppercase tracking-[0.1em] disabled:cursor-not-allowed"
            style={canEndTurn ? {
              ...DISABLED_BUTTON,
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
              backgroundColor: BOARD_TILE_COLORS.propertyRed,
              borderColor: BOARD_TILE_COLORS.propertyRed,
              color: BOARD_TILE_COLORS.altText,
              transition: TRANSITION,
            } : {
              ...DISABLED_BUTTON,
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
            }}
          >
            {t('endTurn')}
          </button>

          <button
            type="button"
            onClick={onManageOpen}
            disabled={!canManage}
            className="rounded-[12px] border px-3 text-sm font-bold uppercase tracking-[0.08em] disabled:cursor-not-allowed"
            style={canManage ? {
              ...DISABLED_BUTTON,
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor: GAME_BOARD_COLORS.border,
              color: GAME_BOARD_COLORS.text,
              transition: TRANSITION,
            } : {
              ...DISABLED_BUTTON,
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
            }}
          >
            {t('manage')}
          </button>

          <button
            type="button"
            onClick={onTradeOpen}
            disabled={!canTrade || !hasOtherTraders}
            className="rounded-[12px] border px-3 text-sm font-bold uppercase tracking-[0.08em] disabled:cursor-not-allowed"
            style={(canTrade && hasOtherTraders) ? {
              ...DISABLED_BUTTON,
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor: GAME_BOARD_COLORS.border,
              color: GAME_BOARD_COLORS.text,
              transition: TRANSITION,
            } : {
              ...DISABLED_BUTTON,
              paddingTop: 'clamp(4px,0.6vmin,8px)',
              paddingBottom: 'clamp(4px,0.6vmin,8px)',
            }}
          >
            {t('trade')}
          </button>

          <div
            className="flex min-w-0 items-center justify-center rounded-[12px] border px-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor: GAME_BOARD_COLORS.border,
              color: GAME_BOARD_COLORS.muted,
            }}
          >
            {isViewerTurn ? t('yourTurn') : t('round', { number: roundNumber })}
          </div>
        </section>

        {/* Center panel — bottom-left 4×3 */}
        <div
          className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0"
          style={dimStyle}
        >
          <CenterPanel
            activeCard={activeCard}
            pendingInteractionPlayerId={pendingInteractionPlayerId}
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
            onCardProceed={onCardProceed}
            onPayDebt={onPayDebt}
            onManage={onManage}
            onBankrupt={onBankrupt}
            onBidAuction={onBidAuction}
            onPayJailFine={onPayJailFine}
            onUseJailCard={onUseJailCard}
            onRoll={onRoll}
            onSendMessage={onSendMessage}
            onSendSticker={onSendSticker}
          />
        </div>

        {/* Deed window — bottom-right 2×3 */}
        <div className="col-span-2 col-start-5 row-span-3 row-start-3 min-h-0">
          <DeedWindow
            space={deedPanelSpace}
            decisionSpace={isBuyDecisionForViewer ? pendingBuySpace : null}
            canAct={isBuyDecisionForViewer}
            canBuy={canBuyProperty}
            onBuy={onBuy}
            onAuction={onAuction}
            viewOnly={!isBuyDecisionForViewer}
            compact
          />
        </div>
      </div>

      <FullOverlay
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
        onTradePropose={onTradePropose}
      />
    </div>
  );
}
