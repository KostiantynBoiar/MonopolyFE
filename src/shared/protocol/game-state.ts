// ======================================================
// PRIMITIVES
// ======================================================

export type IsoDateString = string;

// ======================================================
// ENUMS — TOKEN / VISUAL
// ======================================================

export enum TokenColor {
  Blue   = 'blue',
  Red    = 'red',
  Green  = 'green',
  Yellow = 'yellow',
  Orange = 'orange',
  Pink   = 'pink',
  Cyan   = 'cyan',
  Brown  = 'brown',
  Gold   = 'gold',
  Ink    = 'ink',
}

export enum PropertyColor {
  Brown  = 'brown',
  Cyan   = 'cyan',
  Pink   = 'pink',
  Orange = 'orange',
  Red    = 'red',
  Yellow = 'yellow',
  Green  = 'green',
  Blue   = 'blue',
}

// ======================================================
// ENUMS — GAME LIFECYCLE
// ======================================================

export enum GameStatus {
  Lobby      = 'lobby',
  InProgress = 'in_progress',
  Finished   = 'finished',
}

export enum TurnPhase {
  PreRoll            = 'pre_roll',
  JailDecision       = 'jail_decision',
  PostRoll           = 'post_roll',
  MustPayRent        = 'must_pay_rent',
  DrawingCard        = 'drawing_card',
  Auction            = 'auction',
  TradeNegotiation   = 'trade_negotiation',
  BankruptResolution = 'bankrupt_resolution',
  GameOver           = 'game_over',
}

// ======================================================
// ENUMS — BOARD SPACES
// ======================================================

export enum BoardSpaceType {
  Go             = 'go',
  Property       = 'property',
  Railroad       = 'railroad',
  Utility        = 'utility',
  Chance         = 'chance',
  CommunityChest = 'community_chest',
  IncomeTax      = 'income_tax',
  LuxuryTax      = 'luxury_tax',
  Jail           = 'jail',
  FreeParking    = 'free_parking',
  GoToJail       = 'go_to_jail',
}

export enum AdvanceToNearestSpaceType {
  Railroad = 'railroad',
  Utility  = 'utility',
}

// ======================================================
// ENUMS — AUCTION
// ======================================================

export enum AuctionTargetKind {
  Property = 'property',
  House    = 'house',
  Hotel    = 'hotel',
}

// ======================================================
// ENUMS — DEBT / BANKRUPTCY
// ======================================================

export enum DebtCreditorType {
  Bank   = 'bank',
  Player = 'player',
}

// ======================================================
// ENUMS — CARDS
// ======================================================

export enum CardKind {
  Chance        = 'chance',
  CommunityChest = 'community_chest',
}

export enum CardEffectType {
  AdvanceTo             = 'advance_to',
  AdvanceToNearest      = 'advance_to_nearest',
  GoToJail              = 'go_to_jail',
  GoBack                = 'go_back',
  Collect               = 'collect',
  Pay                   = 'pay',
  CollectFromEachPlayer = 'collect_from_each_player',
  PayEachPlayer         = 'pay_each_player',
  GetOutOfJailFree      = 'get_out_of_jail_free',
  Repairs               = 'repairs',
}

// ======================================================
// ENUMS — TRADE
// ======================================================

export enum TradeStatus {
  Pending   = 'pending',
  Countered = 'countered',
  Accepted  = 'accepted',
  Rejected  = 'rejected',
  Cancelled = 'cancelled',
}

// ======================================================
// ENUMS — LOG
// ======================================================

export enum LogKind {
  Event   = 'event',
  Chat    = 'chat',
  Sticker = 'sticker',
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
  | { position: number; type: BoardSpaceType.Property;  property: PropertyDefinition }
  | { position: number; type: BoardSpaceType.Railroad;  railroad: RailroadDefinition }
  | { position: number; type: BoardSpaceType.Utility;   utility:  UtilityDefinition  }
  | {
      position: number;
      type:
        | BoardSpaceType.Go
        | BoardSpaceType.Chance
        | BoardSpaceType.CommunityChest
        | BoardSpaceType.IncomeTax
        | BoardSpaceType.LuxuryTax
        | BoardSpaceType.Jail
        | BoardSpaceType.FreeParking
        | BoardSpaceType.GoToJail;
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
  doublesStreak:      number;
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
  | { kind: AuctionTargetKind.Property; position: number }
  | { kind: AuctionTargetKind.House }
  | { kind: AuctionTargetKind.Hotel };

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
  | { type: CardEffectType.AdvanceTo;             position: number; collectGoBonus: boolean }
  | { type: CardEffectType.AdvanceToNearest;      spaceType: AdvanceToNearestSpaceType; payDouble: boolean }
  | { type: CardEffectType.GoToJail }
  | { type: CardEffectType.GoBack;                spaces: number }
  | { type: CardEffectType.Collect;               amount: number }
  | { type: CardEffectType.Pay;                   amount: number }
  | { type: CardEffectType.CollectFromEachPlayer; amount: number }
  | { type: CardEffectType.PayEachPlayer;         amount: number }
  | { type: CardEffectType.GetOutOfJailFree }
  | { type: CardEffectType.Repairs;               perHouse: number; perHotel: number };

export type ActiveCard = {
  id:       string;
  kind:     CardKind;
  text:     string;
  effect:   CardEffect;
  drawerId: string;
};

export type DeckState = {
  chance:                 string[];
  communityChest:         string[];
  discardedChance:        string[];
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
  id:          string;
  kind:        LogKind;
  playerId?:   string;
  playerName?: string;
  playerToken?: TokenColor;
  text:        string;
  stickerUrl?: string;
  ts:          IsoDateString;
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
