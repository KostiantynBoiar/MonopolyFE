import type { TokenColor } from '@/shared/protocol/game-state.enums';
import type { DiceRoll, LogEntry, TradeOffer } from '@/shared/protocol/game-state';
import type { ActiveCard, AuctionState, TradeState } from '@/shared/protocol/game-state';
import type { AuctionPlayer } from '@/features/auction/auction.types';
import type { DeedInfo } from '@/features/deed/deed.types';
import type { ManageProperty } from '@/features/manage/ManagePropertiesOverlay';
import type { TradeAsset, TradePlayer } from '@/features/trade/trade-builder.types';
import type { TradeParticipant } from '@/features/trade/trade.types';
import type { ActionKey } from './chat.enums';

/**
 * ChatMessage is kept for lobby use (pre-game WS chat from socket-store).
 * For in-game activity, pass LogEntry[] directly — no conversion needed.
 */
export interface ChatMessage {
  id: string;
  kind: 'chat' | 'event';
  /** Sender's user id — the source of truth for "is this mine" (tokens aren't unique). */
  fromUserId?: string;
  author?: string;
  token?: TokenColor;
  text: string;
  ts: number;
}

/** Lobby chat log — still uses ChatMessage (from WS, not GameState). */
export interface ChatLogProps {
  log: LogEntry[];
}

export interface ChatWindowProps {
  log: LogEntry[];
  /** Live, server-sourced chat messages from ALL players (reactive). */
  externalMessages?: ChatMessage[];
  viewerToken?: TokenColor;
  /** Authenticated viewer's user id — used to right-align the viewer's own messages. */
  viewerUserId?: string;
  onSendMessage?: (text: string) => void;
  onSendSticker?: (url: string) => void;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: string[];
}

export interface Action {
  key: ActionKey;
  label: string;
  primary?: boolean;
  enabled: boolean;
  handler?: () => void;
}

/** Core game log and turn actions */
export interface LogAndActionsProps {
  log: LogEntry[];
  diceRoll?: DiceRoll | null;
  diceRollId?: number;
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
}

/** Card flip overlay props */
export interface CardOverlayProps {
  activeCard?: ActiveCard | null;
  onCardProceed?: () => void;
  canCardProceed?: boolean;
}

/** Deed (buy/auction) overlay props */
export interface DeedOverlayProps {
  activeDeed?: DeedInfo | null;
  canBuyDeed?: boolean;
  canManageDeed?: boolean;
  onAuction?: () => void;
  onManageDeed?: () => void;
}

/** Jail decision overlay props */
export interface JailOverlaySlotProps {
  jailDecision?: boolean;
  jailAttempts?: number;
  canPayJailFine?: boolean;
  canUseJailCard?: boolean;
  canRollInJail?: boolean;
  jailDiceRoll?: DiceRoll | null;
  jailIsRolling?: boolean;
  onPayJailFine?: () => void;
  onUseJailCard?: () => void;
  onRollInJail?: () => void;
}

/** Debt and bankruptcy overlay props */
export interface DebtOverlaySlotProps {
  debtPending?: boolean;
  debtAmount?: number;
  canPayDebt?: boolean;
  onPayDebt?: () => void;
  onManageDebt?: () => void;
  onDeclareBankruptcy?: () => void;
}

/** Auction panel props (swaps the chat container when active) */
export interface AuctionPanelSlotProps {
  auctionState?: AuctionState | null;
  auctionPropertyName?: string;
  auctionPlayers?: AuctionPlayer[];
  canBid?: boolean;
  onBid?: (amount: number) => void;
}

/** Trade window props (swaps the chat container when active) */
export interface TradeWindowProps {
  tradeState?: TradeState | null;
  tradeProposer?: TradeParticipant;
  tradeTarget?: TradeParticipant;
  viewerId?: string;
  onTradeAccept?: () => void;
  onTradeReject?: () => void;
  onTradeCounter?: () => void;
  onTradeCancel?: () => void;
}

/** Manage properties modal overlay props */
export interface ManageOverlayProps {
  manageOpen?: boolean;
  manageProperties?: ManageProperty[];
  canBuildHouse?: boolean;
  canBuildHotel?: boolean;
  canMortgage?: boolean;
  canUnmortgage?: boolean;
  onBuildHouse?: (position: number) => void;
  onBuildHotel?: (position: number) => void;
  onSellHouse?: (position: number) => void;
  onSellHotel?: (position: number) => void;
  onMortgage?: (position: number) => void;
  onUnmortgage?: (position: number) => void;
  onCloseManage?: () => void;
}

/** Trade builder modal overlay props */
export interface TradeBuilderOverlayProps {
  tradeBuilderOpen?: boolean;
  tradeMe?: TradePlayer;
  tradeOthers?: TradePlayer[];
  tradeMyProperties?: TradeAsset[];
  tradeMyJailCards?: number;
  tradePropertiesOf?: (playerId: string) => TradeAsset[];
  tradeJailCardsOf?: (playerId: string) => number;
  onTradePropose?: (targetId: string, offer: TradeOffer, request: TradeOffer) => void;
  onCloseTradeBuilder?: () => void;
}
