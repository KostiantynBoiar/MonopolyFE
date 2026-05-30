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

export type BoardCenterPanelProps = {
  /** In-game activity log — consumed directly from GameState.log. */
  log: LogEntry[];
  diceRoll?: DiceRoll | null;
  isRolling?: boolean;
  canRoll?: boolean;
  canBuy?: boolean;
  canBuild?: boolean;
  canTrade?: boolean;
  onRoll?: () => void;
  onBuy?: () => void;
  onBuild?: () => void;
  onTrade?: () => void;
  onSendMessage?: (text: string) => void;
  // Card drawing overlay
  activeCard?: ActiveCard | null;
  onCardProceed?: () => void;
  // Deed card overlay (shown when landing on unowned purchasable property)
  activeDeed?: DeedInfo | null;
  onAuction?: () => void;
  // Auction panel (swaps chat container when active)
  auctionState?: AuctionState | null;
  auctionPropertyName?: string;
  auctionPlayers?: AuctionPlayer[];
  canBid?: boolean;
  onBid?: (amount: number) => void;
  // Trade window (swaps chat container when active)
  tradeState?: TradeState | null;
  tradeProposer?: TradeParticipant;
  tradeTarget?: TradeParticipant;
  viewerId?: string;
  onTradeAccept?: () => void;
  onTradeReject?: () => void;
  onTradeCancel?: () => void;
};
