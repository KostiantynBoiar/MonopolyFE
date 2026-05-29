import type { TokenColor } from '@/features/player-panel';
export type { TokenColor };

// ─── Primitives ───────────────────────────────────────────────────────────────

export type GameStatus = 'lobby' | 'in_progress' | 'finished';

export type TurnPhase =
  | 'pre_roll'            // awaiting dice roll (or jail-exit decision)
  | 'jail_decision'       // in-jail player must choose: roll / pay / use card
  | 'post_roll'           // moved; can buy, build, mortgage, trade before ending
  | 'must_pay_rent'       // player owes rent; all other actions blocked
  | 'drawing_card'        // resolving a Chance or Community Chest card
  | 'auction'             // property up for auction (no one bought it)
  | 'trade_negotiation'   // a trade offer is live and awaiting response
  | 'bankrupt_resolution' // player cannot pay; assets being redistributed
  | 'game_over';

// ─── Sub-shapes ───────────────────────────────────────────────────────────────

export type DiceRoll = {
  die1: number;   // 1–6
  die2: number;   // 1–6
  isDoubles: boolean;
};

export type JailStatus = {
  turnsRemaining: number;  // counts down 3 → 2 → 1; forced-pay on 0
};

export type ActionSet = {
  canRoll: boolean;
  canBuy: boolean;          // landed on unowned property this turn
  canBuild: boolean;        // owns complete color group; houses available
  canMortgage: boolean;
  canUnmortgage: boolean;
  canTrade: boolean;
  canEndTurn: boolean;
  canPayJailFine: boolean;  // pay $50 to exit jail immediately
  canUseJailCard: boolean;  // spend a Get Out of Jail Free card
  canBid: boolean;          // auction phase only
};

export type SpaceOwnership = {
  position: number;
  ownerId: string | null;   // null = bank / non-purchasable
  houses: number;           // 0–4
  hasHotel: boolean;        // 5th house becomes a hotel
  isMortgaged: boolean;
};

// ─── Players ──────────────────────────────────────────────────────────────────

export type PlayerState = {
  id: string;
  userId: string;
  displayName: string;
  token: TokenColor;
  avatarUrl: string | null;
  turnOrder: number;           // 0-based seat index (determines play order)

  position: number;            // 0–39
  balance: number;
  ownedPositions: number[];
  getOutOfJailCards: number;
  jailStatus: JailStatus | null;  // null when not in jail
  isBankrupt: boolean;
  isConnected: boolean;

  netWorth: number;            // balance + property values + building values
};

// ─── Turn ─────────────────────────────────────────────────────────────────────

export type TurnState = {
  phase: TurnPhase;
  currentPlayerId: string;
  turnNumber: number;          // increments each time the active player changes
  roundNumber: number;         // increments after all players have gone once
  diceRoll: DiceRoll | null;   // null before rolling
  doublesStreak: number;       // 0–2; hitting 3 sends the player to jail
  actionsAvailable: ActionSet; // scoped to the viewer (viewerId)
};

// ─── Auction ──────────────────────────────────────────────────────────────────

export type AuctionBid = {
  playerId: string;
  amount: number;
};

export type AuctionState = {
  propertyPosition: number;
  bids: AuctionBid[];
  highestBid: number;
  highestBidderId: string | null;
  timeRemainingMs: number;
};

// ─── Trade ────────────────────────────────────────────────────────────────────

export type TradeOffer = {
  money: number;
  positions: number[];          // board positions of properties offered
  getOutOfJailCards: number;
};

export type TradeState = {
  id: string;
  proposerId: string;
  targetId: string;
  proposerOffer: TradeOffer;    // what the proposer gives
  targetRequest: TradeOffer;    // what the proposer asks for in return
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'cancelled';
  expiresAt: string;            // ISO 8601; UI shows countdown
};

// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardKind = 'chance' | 'community_chest';

export type CardEffect =
  | { type: 'advance_to'; position: number; collectGoBonus: boolean }
  | { type: 'advance_to_nearest'; spaceType: 'railroad' | 'utility'; payDouble: boolean }
  | { type: 'go_to_jail' }
  | { type: 'go_back'; spaces: number }
  | { type: 'collect'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'collect_from_each_player'; amount: number }
  | { type: 'pay_each_player'; amount: number }
  | { type: 'get_out_of_jail_free' }
  | { type: 'repairs'; perHouse: number; perHotel: number };

export type ActiveCard = {
  id: string;
  kind: CardKind;
  text: string;
  effect: CardEffect;
  drawerId: string;
};

// ─── Chat / Event log ─────────────────────────────────────────────────────────

export type LogKind = 'event' | 'chat' | 'sticker';

export type LogEntry = {
  id: string;
  kind: LogKind;
  playerId?: string;
  playerName?: string;
  playerToken?: TokenColor;
  text: string;
  stickerUrl?: string;    // present only when kind === 'sticker'
  ts: string;             // ISO 8601
};

// ─── Root game state ──────────────────────────────────────────────────────────

export type GameState = {
  // Identity
  gameId: string;
  sessionCode: string;    // e.g. "TYC-A7X2" — shown in invite UI

  // Lifecycle
  status: GameStatus;
  createdAt: string;      // ISO 8601
  startedAt: string | null;
  finishedAt: string | null;
  winnerId: string | null;

  // Participants (ordered by turnOrder)
  players: PlayerState[];
  viewerId: string;       // which player this client controls

  // Current turn
  turn: TurnState;

  // Board ownership & buildings (40 entries, index === position)
  spaces: SpaceOwnership[];

  // At most one of these is non-null at a time
  auction: AuctionState | null;
  trade: TradeState | null;
  activeCard: ActiveCard | null;

  // Event & chat history (append-only; newest last)
  log: LogEntry[];
};
