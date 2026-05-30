// ======================================================
// PRIMITIVES
// ======================================================

export type IsoDateString = string;

// ======================================================
// ENUMS — TOKEN / VISUAL
// ======================================================

export enum TokenColor {
  BLUE   = 'blue',
  RED    = 'red',
  GREEN  = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  PINK   = 'pink',
  CYAN   = 'cyan',
  BROWN  = 'brown',
  GOLD   = 'gold',
  INK    = 'ink',
}

export enum PropertyColor {
  BROWN  = 'brown',
  CYAN   = 'cyan',
  PINK   = 'pink',
  ORANGE = 'orange',
  RED    = 'red',
  YELLOW = 'yellow',
  GREEN  = 'green',
  BLUE   = 'blue',
}

// ======================================================
// ENUMS — GAME LIFECYCLE
// ======================================================

export enum GameStatus {
  LOBBY       = 'lobby',
  IN_PROGRESS = 'in_progress',
  FINISHED    = 'finished',
}

export enum TurnPhase {
  PRE_ROLL             = 'pre_roll',
  JAIL_DECISION        = 'jail_decision',
  POST_ROLL            = 'post_roll',
  MUST_PAY_RENT        = 'must_pay_rent',
  DRAWING_CARD         = 'drawing_card',
  AUCTION              = 'auction',
  TRADE_NEGOTIATION    = 'trade_negotiation',
  BANKRUPT_RESOLUTION  = 'bankrupt_resolution',
  GAME_OVER            = 'game_over',
}

// ======================================================
// ENUMS — BOARD SPACES
// ======================================================

export enum BoardSpaceType {
  GO              = 'go',
  PROPERTY        = 'property',
  RAILROAD        = 'railroad',
  UTILITY         = 'utility',
  CHANCE          = 'chance',
  COMMUNITY_CHEST = 'community_chest',
  INCOME_TAX      = 'income_tax',
  LUXURY_TAX      = 'luxury_tax',
  JAIL            = 'jail',
  FREE_PARKING    = 'free_parking',
  GO_TO_JAIL      = 'go_to_jail',
}

export enum AdvanceToNearestSpaceType {
  RAILROAD = 'railroad',
  UTILITY  = 'utility',
}

// ======================================================
// ENUMS — AUCTION
// ======================================================

export enum AuctionTargetKind {
  PROPERTY = 'property',
  HOUSE    = 'house',
  HOTEL    = 'hotel',
}

// ======================================================
// ENUMS — DEBT / BANKRUPTCY
// ======================================================

export enum DebtCreditorType {
  BANK   = 'bank',
  PLAYER = 'player',
}

// ======================================================
// ENUMS — CARDS
// ======================================================

export enum CardKind {
  CHANCE         = 'chance',
  COMMUNITY_CHEST = 'community_chest',
}

export enum CardEffectType {
  ADVANCE_TO              = 'advance_to',
  ADVANCE_TO_NEAREST      = 'advance_to_nearest',
  GO_TO_JAIL              = 'go_to_jail',
  GO_BACK                 = 'go_back',
  COLLECT                 = 'collect',
  PAY                     = 'pay',
  COLLECT_FROM_EACH_PLAYER = 'collect_from_each_player',
  PAY_EACH_PLAYER         = 'pay_each_player',
  GET_OUT_OF_JAIL_FREE    = 'get_out_of_jail_free',
  REPAIRS                 = 'repairs',
}

// ======================================================
// ENUMS — TRADE
// ======================================================

export enum TradeStatus {
  PENDING   = 'pending',
  COUNTERED = 'countered',
  ACCEPTED  = 'accepted',
  REJECTED  = 'rejected',
  CANCELLED = 'cancelled',
}

// ======================================================
// ENUMS — LOG
// ======================================================

export enum LogKind {
  EVENT   = 'event',
  CHAT    = 'chat',
  STICKER = 'sticker',
}

// ======================================================
// BOARD DEFINITIONS (IMMUTABLE — sent once in snapshot)
// ======================================================

export type PropertyDefinition = {
  position:      number;
  name:          string;
  color:         PropertyColor;
  price:         number;
  mortgageValue: number;
  houseCost:     number;
  rents: {
    base:        number;
    monopoly:    number;
    oneHouse:    number;
    twoHouses:   number;
    threeHouses: number;
    fourHouses:  number;
    hotel:       number;
  };
};

export type RailroadDefinition = {
  position:      number;
  name:          string;
  price:         number;
  mortgageValue: number;
};

export type UtilityDefinition = {
  position:      number;
  name:          string;
  price:         number;
  mortgageValue: number;
};

export type BoardSpaceDefinition =
  | { position: number; type: BoardSpaceType.PROPERTY;  property: PropertyDefinition }
  | { position: number; type: BoardSpaceType.RAILROAD;  railroad: RailroadDefinition }
  | { position: number; type: BoardSpaceType.UTILITY;   utility:  UtilityDefinition  }
  | {
      position: number;
      type:
        | BoardSpaceType.GO
        | BoardSpaceType.CHANCE
        | BoardSpaceType.COMMUNITY_CHEST
        | BoardSpaceType.INCOME_TAX
        | BoardSpaceType.LUXURY_TAX
        | BoardSpaceType.JAIL
        | BoardSpaceType.FREE_PARKING
        | BoardSpaceType.GO_TO_JAIL;
      name: string;
    };

// ======================================================
// BANK
// ======================================================

export type BankState = {
  availableHouses: number;
  availableHotels: number;
};

// ======================================================
// PROPERTY OWNERSHIP
// ======================================================

export type PropertyState = {
  position:    number;
  ownerId:     string | null;
  houses:      0 | 1 | 2 | 3 | 4;
  hotel:       boolean;
  isMortgaged: boolean;
};

// ======================================================
// PLAYERS
// ======================================================

export type JailStatus = {
  attempts: number;
};

export type PlayerState = {
  id:                 string;
  userId:             string;
  displayName:        string;
  token:              TokenColor;
  avatarUrl:          string | null;
  turnOrder:          number;
  position:           number;
  balance:            number;
  getOutOfJailCards:  number;
  jailStatus:         JailStatus | null;
  isBankrupt:         boolean;
  isConnected:        boolean;
};

// ======================================================
// TURN
// ======================================================

export type DiceRoll = {
  die1:      number;
  die2:      number;
  isDoubles: boolean;
};

export type TurnState = {
  phase:           TurnPhase;
  currentPlayerId: string;
  turnNumber:      number;
  roundNumber:     number;
  diceRoll:        DiceRoll | null;
  doublesStreak:   number;
  extraTurn:       boolean;
};

// ======================================================
// DEBT
// ======================================================

export type DebtState = {
  debtorId:     string;
  creditorType: DebtCreditorType;
  creditorId:   string | null;
  amount:       number;
};

// ======================================================
// AUCTIONS
// ======================================================

export type AuctionBid = {
  playerId: string;
  amount:   number;
};

export type AuctionTarget =
  | { kind: AuctionTargetKind.PROPERTY; position: number }
  | { kind: AuctionTargetKind.HOUSE }
  | { kind: AuctionTargetKind.HOTEL };

export type AuctionState = {
  target:           AuctionTarget;
  bids:             AuctionBid[];
  highestBid:       number;
  highestBidderId:  string | null;
  timeRemainingMs:  number;
};

// ======================================================
// TRADING
// ======================================================

export type TradeOffer = {
  money:              number;
  positions:          number[];
  getOutOfJailCards:  number;
};

export type TradeState = {
  id:            string;
  proposerId:    string;
  targetId:      string;
  proposerOffer: TradeOffer;
  targetRequest: TradeOffer;
  status:        TradeStatus;
  expiresAt:     IsoDateString;
};

// ======================================================
// CARDS
// ======================================================

export type CardEffect =
  | { type: CardEffectType.ADVANCE_TO;              position: number; collectGoBonus: boolean }
  | { type: CardEffectType.ADVANCE_TO_NEAREST;      spaceType: AdvanceToNearestSpaceType; payDouble: boolean }
  | { type: CardEffectType.GO_TO_JAIL }
  | { type: CardEffectType.GO_BACK;                 spaces: number }
  | { type: CardEffectType.COLLECT;                 amount: number }
  | { type: CardEffectType.PAY;                     amount: number }
  | { type: CardEffectType.COLLECT_FROM_EACH_PLAYER; amount: number }
  | { type: CardEffectType.PAY_EACH_PLAYER;         amount: number }
  | { type: CardEffectType.GET_OUT_OF_JAIL_FREE }
  | { type: CardEffectType.REPAIRS;                 perHouse: number; perHotel: number };

export type ActiveCard = {
  id:       string;
  kind:     CardKind;
  text:     string;
  effect:   CardEffect;
  drawerId: string;
};

export type DeckState = {
  chance:                  string[];
  communityChest:          string[];
  discardedChance:         string[];
  discardedCommunityChest: string[];
};

// ======================================================
// BANKRUPTCY
// ======================================================

export type BankruptcyState = {
  playerId:     string;
  creditorType: DebtCreditorType;
  creditorId:   string | null;
};

// ======================================================
// LOG
// ======================================================

export type LogEntry = {
  id:           string;
  kind:         LogKind;
  playerId?:    string;
  playerName?:  string;
  playerToken?: TokenColor;
  text:         string;
  stickerUrl?:  string;
  ts:           IsoDateString;
};

// ======================================================
// ROOT GAME STATE
// ======================================================

export type GameState = {
  gameId:      string;
  sessionCode: string;
  status:      GameStatus;
  createdAt:   IsoDateString;
  startedAt:   IsoDateString | null;
  finishedAt:  IsoDateString | null;
  winnerId:    string | null;
  viewerId:    string;
  players:     PlayerState[];
  turn:        TurnState;
  bank:        BankState;
  spaces:      PropertyState[];
  debt:        DebtState | null;
  auction:     AuctionState | null;
  trade:       TradeState | null;
  activeCard:  ActiveCard | null;
  bankruptcy:  BankruptcyState | null;
  decks:       DeckState;
  log:         LogEntry[];
};
