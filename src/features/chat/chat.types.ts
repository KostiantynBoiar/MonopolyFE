import type { TokenColor } from '@/features/player-panel';
import type { LogEntry } from '@/shared/protocol/game-state';
import type { ActiveCard, AuctionState, TradeState } from '@/shared/protocol/game-state.schema';
import type { TradeParticipant } from '@/features/trade';
import type { DeedInfo } from '@/features/deed';
import type { AuctionPlayer } from '@/features/auction';
import { ActionKey } from './chat.enums';

/**
 * ChatMessage is kept for lobby use (pre-game WS chat from socket-store).
 * For in-game activity, pass LogEntry[] directly — no conversion needed.
 */
export type ChatMessage = {
  id: string;
  kind: 'chat' | 'event';
  author?: string;
  token?: TokenColor;
  text: string;
  ts: number;
};

/** Lobby chat log — still uses ChatMessage (from WS, not GameState). */
export type ChatLogProps = {
  log: LogEntry[];
};

export type DiceRoll = {
  die1: number;
  die2: number;
  isDoubles: boolean;
};

export type StickerPack = {
  id: string;
  name: string;
  stickers: string[];
};

export type Action = {
  key: ActionKey;
  label: string;
  primary?: boolean;
  enabled: boolean;
  handler?: () => void;
};

/** Core game log and turn actions */
export type LogAndActionsProps = {
  log: LogEntry[];
  diceRoll?: DiceRoll | null;
  isRolling?: boolean;
  canRoll?: boolean;
  canBuy?: boolean;
  canManage?: boolean;
  canTrade?: boolean;
  canEndTurn?: boolean;
  onRoll?: () => void;
  onBuy?: () => void;
  onManage?: () => void;
  onTrade?: () => void;
  onEndTurn?: () => void;
  onSendMessage?: (text: string) => void;
};

/** Card flip overlay props */
export type CardOverlayProps = {
  activeCard?: ActiveCard | null;
  onCardProceed?: () => void;
};

/** Deed (buy/auction) overlay props */
export type DeedOverlayProps = {
  activeDeed?: DeedInfo | null;
  onAuction?: () => void;
};

/** Jail decision overlay props */
export type JailOverlayProps = {
  jailDecision?: boolean;
  jailAttempts?: number;
  canPayJailFine?: boolean;
  canUseJailCard?: boolean;
  canRollInJail?: boolean;
  onPayJailFine?: () => void;
  onUseJailCard?: () => void;
  onRollInJail?: () => void;
};

/** Debt and bankruptcy overlay props */
export type DebtOverlayProps = {
  debtPending?: boolean;
  debtAmount?: number;
  canPayDebt?: boolean;
  onPayDebt?: () => void;
  onManageDebt?: () => void;
  onDeclareBankruptcy?: () => void;
};

/** Auction panel props (swaps the chat container when active) */
export type AuctionPanelProps = {
  auctionState?: AuctionState | null;
  auctionPropertyName?: string;
  auctionPlayers?: AuctionPlayer[];
  canBid?: boolean;
  onBid?: (amount: number) => void;
};

/** Trade window props (swaps the chat container when active) */
export type TradeWindowProps = {
  tradeState?: TradeState | null;
  tradeProposer?: TradeParticipant;
  tradeTarget?: TradeParticipant;
  viewerId?: string;
  onTradeAccept?: () => void;
  onTradeReject?: () => void;
  onTradeCounter?: () => void;
  onTradeCancel?: () => void;
};

/** Combined props for the BoardCenterPanel component */
export type BoardCenterPanelProps = LogAndActionsProps &
  CardOverlayProps &
  DeedOverlayProps &
  JailOverlayProps &
  DebtOverlayProps &
  AuctionPanelProps &
  TradeWindowProps;
