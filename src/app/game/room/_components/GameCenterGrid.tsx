'use client';

import { useTranslations } from 'next-intl';
import { CardFlipOverlay } from '@/features/card';
import { DeedWindow } from '@/features/deed';
import { DiceWindow } from '@/features/dice';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import type { ActiveCard } from '@/shared/protocol/game-state';
import { SettingsControl } from '@/shared/ui';
import { CenterPanel, type CenterPanelProps } from './CenterPanel';
import { FullOverlay, type FullOverlayProps } from './FullOverlay';
import { TurnTimer } from './TurnTimer';
import { SurrenderButton } from './SurrenderButton';
import {
  ACTION_CLASS,
  DISABLED_ACTION,
  GHOST_ACTION,
  ROLL_FONT,
  accentAction,
} from './action-button.styles';

export interface GameCenterGridProps extends CenterPanelProps, FullOverlayProps {
  // Drawn-card overlay — rendered across the whole center (not the chat cell).
  activeCard: ActiveCard | null;
  pendingInteractionPlayerId: string | null;
  onCardProceed: () => void;
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
  turnDeadlineMs: number | null;
  canSurrender: boolean;
  onEndTurn: () => void;
  onManageOpen: () => void;
  onTradeOpen: () => void;
  onBuy: () => void;
  onAuction: () => void;
  onSurrender: () => void;
}


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
  turnDeadlineMs,
  canSurrender,
  isRolling,
  // Button handlers
  onRoll,
  onEndTurn,
  onManageOpen,
  onTradeOpen,
  onBuy,
  onAuction,
  onSurrender,
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
  viewerUserId,
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
  onTradeGiveMoneyChange,
  onTradeGetMoneyChange,
  onTradeGiveCardsChange,
  onTradeGetCardsChange,
  onTradeClearOfferAssets,
  onTradeClearRequestAssets,
  onTradePropose,
}: GameCenterGridProps) {
  const t = useTranslations('Game');

  const dimStyle = {
    opacity: isBuyDecisionForViewer ? 0.15 : 1,
    filter: isBuyDecisionForViewer ? 'saturate(0.82)' : 'none',
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
            className={`${ACTION_CLASS} col-span-2 px-3 font-display font-black uppercase tracking-[0.12em]`}
            style={canRoll
              ? { ...accentAction(BOARD_TILE_COLORS.propertyGreen, '0 2px 10px rgba(121,180,143,0.45)'), ...ROLL_FONT }
              : { ...DISABLED_ACTION, ...ROLL_FONT }}
          >
            {isRolling ? t('rolling') : t('roll')}
          </button>

          <button
            type="button"
            onClick={onEndTurn}
            disabled={!canEndTurn}
            className={`${ACTION_CLASS} px-3 font-display text-sm font-black uppercase tracking-[0.1em]`}
            style={canEndTurn
              ? accentAction(BOARD_TILE_COLORS.propertyRed, '0 2px 10px rgba(228,135,135,0.45)')
              : DISABLED_ACTION}
          >
            {t('endTurn')}
          </button>

          <button
            type="button"
            onClick={onManageOpen}
            disabled={!canManage}
            className={`${ACTION_CLASS} px-3 text-sm font-bold uppercase tracking-[0.08em]`}
            style={canManage ? GHOST_ACTION : DISABLED_ACTION}
          >
            {t('manage')}
          </button>

          <button
            type="button"
            onClick={onTradeOpen}
            disabled={!canTrade || !hasOtherTraders}
            className={`${ACTION_CLASS} px-3 text-sm font-bold uppercase tracking-[0.08em]`}
            style={(canTrade && hasOtherTraders) ? GHOST_ACTION : DISABLED_ACTION}
          >
            {t('trade')}
          </button>

          <div
            className="relative flex min-w-0 flex-col items-center justify-center gap-[2px] rounded-[14px] border px-2 py-1 text-center"
            style={{
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor: GAME_BOARD_COLORS.border,
              color: GAME_BOARD_COLORS.muted,
              boxShadow: '0 1px 2px rgba(51,48,43,0.08)',
            }}
          >
            <SettingsControl className="absolute right-1 top-1 h-6 w-6" />
            <TurnTimer deadlineMs={turnDeadlineMs} />
            {isViewerTurn && canSurrender ? (
              <SurrenderButton onSurrender={onSurrender} />
            ) : (
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                {isViewerTurn ? t('yourTurn') : t('round', { number: roundNumber })}
              </span>
            )}
          </div>
        </section>

        {/* Center panel — bottom-left 4×3 */}
        <div
          className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0"
          style={dimStyle}
        >
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

      {/* Drawn card — covers the entire center, above the dice/actions/deed grid. */}
      {activeCard && (
        <div
          className="absolute inset-[6px] z-20 flex items-center justify-center rounded-[12px]"
          style={{
            backgroundColor: 'rgba(20,16,12,0.55)',
            backdropFilter: 'blur(2px)',
            fontSize: 'clamp(15px,2.4vmin,24px)',
          }}
        >
          <CardFlipOverlay
            card={activeCard}
            onProceed={onCardProceed}
            canProceed={pendingInteractionPlayerId !== null && pendingInteractionPlayerId === viewerPlayerId}
          />
        </div>
      )}

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
        onTradeGiveMoneyChange={onTradeGiveMoneyChange}
        onTradeGetMoneyChange={onTradeGetMoneyChange}
        onTradeGiveCardsChange={onTradeGiveCardsChange}
        onTradeGetCardsChange={onTradeGetCardsChange}
        onTradeClearOfferAssets={onTradeClearOfferAssets}
        onTradeClearRequestAssets={onTradeClearRequestAssets}
        onTradePropose={onTradePropose}
      />
    </div>
  );
}
