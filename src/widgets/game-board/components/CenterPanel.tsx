'use client';

import { AuctionOverlay } from '@/features/auction-overlay/components/AuctionOverlay';
import { DebtOverlay } from '@/features/indebt-overlay/DebtOverlay';
import type { ChatMessage } from '@/features/chat-widget/chat.types';
import { ChatWindow } from '@/features/chat-widget/components/ChatWindow';
import { JailOverlay } from '@/features/jail-overlay/JailOverlay';
import { useBoardTileName } from '@/features/game-board/board-tile-name';
import type { AuctionState, DebtState, DiceRoll, JailStatus, LogEntry } from '@/shared/protocol/game-state';
import { AuctionTargetKind, TurnPhase } from '@/shared/protocol/game-state.enums';
import type { TokenColor } from '@/shared/protocol/game-state.enums';

export interface CenterPanelProps {
  viewerPlayerId: string | null;
  debt: DebtState | null;
  auction: AuctionState | null;
  auctionPlayers: { id: string; name: string }[];
  turnPhase: TurnPhase;
  jailStatus: JailStatus | null;
  diceRoll: DiceRoll | null;
  isRolling: boolean;
  canPayDebt: boolean;
  canBidAuction: boolean;
  canRollInJail: boolean;
  canPayJailFine: boolean;
  canUseJailCard: boolean;
  log: LogEntry[];
  chatMessages: ChatMessage[];
  viewerToken?: TokenColor;
  viewerUserId?: string;
  onPayDebt: () => void;
  onManage: () => void;
  onBankrupt: () => void;
  onBidAuction: (amount: number) => void;
  onPayJailFine: () => void;
  onUseJailCard: () => void;
  onRoll: () => void;
  onSurrender?: () => void;
  onSendMessage: (text: string) => void;
  onSendSticker: (url: string) => void;
}

export function CenterPanel({
  viewerPlayerId,
  debt,
  auction,
  auctionPlayers,
  turnPhase,
  jailStatus,
  diceRoll,
  isRolling,
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
  onRoll,
  onSurrender,
  onSendMessage,
  onSendSticker,
}: CenterPanelProps) {
  const resolveTileName = useBoardTileName();

  if (debt && debt.debtorId === viewerPlayerId) {
    return (
      <DebtOverlay
        amount={debt.amount}
        canPay={canPayDebt}
        onPay={onPayDebt}
        onManage={onManage}
        onBankrupt={onBankrupt}
      />
    );
  }

  if (auction) {
    const propertyName =
      auction.target.kind === AuctionTargetKind.PROPERTY
        ? resolveTileName(auction.target.position)
        : auction.target.kind;

    return (
      <AuctionOverlay
        auctionState={auction}
        propertyName={propertyName}
        viewerId={viewerPlayerId ?? ''}
        players={auctionPlayers}
        canBid={canBidAuction}
        onBid={onBidAuction}
      />
    );
  }

  if (turnPhase === TurnPhase.JAIL_DECISION && jailStatus) {
    return (
      <JailOverlay
        attempts={jailStatus.attempts}
        canPayFine={canPayJailFine}
        canUseCard={canUseJailCard}
        canRoll={canRollInJail && !isRolling}
        diceRoll={diceRoll}
        isRolling={isRolling}
        onPayFine={onPayJailFine}
        onUseCard={onUseJailCard}
        onRoll={onRoll}
        onSurrender={onSurrender}
      />
    );
  }

  return (
    <ChatWindow
      log={log}
      externalMessages={chatMessages}
      viewerToken={viewerToken}
      viewerUserId={viewerUserId}
      onSendMessage={onSendMessage}
      onSendSticker={onSendSticker}
    />
  );
}
