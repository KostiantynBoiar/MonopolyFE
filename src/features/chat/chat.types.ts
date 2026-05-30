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

/** Active card drawing overlay props */
export type ActiveCardProps = {
  card: ActiveCard;
  onProceed: () => void;
};

/** Deed card overlay props (shown when landing on unowned purchasable property) */
export type DeedOverlayProps = {
  deed: DeedInfo;
  onAuction: () => void;
};

/** Jail decision overlay props (shown when the viewer is jailed on their turn) */
export type JailOverlayProps = {
  attempts: number;
  canPayFine: boolean;
  canUseCard: boolean;
  canRoll: boolean;
  onPayFine: () => void;
  onUseCard: () => void;
  onRoll: () => void;
};

/** Debt overlay props (shown when the viewer owes more than they can immediately pay) */
export type DebtOverlayProps = {
  amount: number;
  canPayDebt: boolean;
  onPayDebt: () => void;
  onManageDebt: () => void;
  onDeclareBankruptcy: () => void;
};

/** Auction panel props (swaps chat container when active) */
export type AuctionPanelProps = {
  state: AuctionState;
  propertyName: string;
  players: AuctionPlayer[];
  canBid: boolean;
  onBid: (amount: number) => void;
};

/** Trade window props (swaps chat container when active) */
export type TradePanelProps = {
  state: TradeState;
  proposer: TradeParticipant;
  target: TradeParticipant;
  viewerId: string;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
  onCancel: () => void;
};

export type BoardCenterPanelProps = {
  /** In-game activity log — consumed directly from GameState.log. */
  log: LogEntry[];
  diceRoll?: DiceRoll | null;
  isRolling?: boolean;
  canRoll?: boolean;
  canBuy?: boolean;
  canManage?: boolean;
  canTrade?: boolean;
  onRoll?: () => void;
  onBuy?: () => void;
  onManage?: () => void;
  onTrade?: () => void;
  onSendMessage?: (text: string) => void;
  // Overlays
  activeCard?: ActiveCardProps | null;
  activeDeed?: DeedOverlayProps | null;
  jail?: JailOverlayProps | null;
  debt?: DebtOverlayProps | null;
  auction?: AuctionPanelProps | null;
  trade?: TradePanelProps | null;
};
