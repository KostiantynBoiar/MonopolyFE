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
// TYPED GAME EVENTS
// ======================================================
// Every EVENT-kind LogEntry carries a machine-readable `event` payload alongside
// its human `text`. Events denormalize the display strings they need (playerName,
// propertyName) so renderEvent stays a pure (event) => string — and so the log is
// a self-contained, replayable activity feed independent of current state.

export enum GameEventType {
  TurnStarted     = 'turn_started',
  RoundStarted    = 'round_started',
  DiceRolled      = 'dice_rolled',
  PlayerMoved     = 'player_moved',
  PassedGo        = 'passed_go',
  PropertyBought  = 'property_bought',
  PropertySold    = 'property_sold',
  RentPaid        = 'rent_paid',
  TaxPaid         = 'tax_paid',
  CardDrawn       = 'card_drawn',
  CardResolved    = 'card_resolved',
  SentToJail      = 'sent_to_jail',
  LeftJail        = 'left_jail',
  HouseBuilt      = 'house_built',
  HotelBuilt      = 'hotel_built',
  HouseSold       = 'house_sold',
  HotelSold       = 'hotel_sold',
  Mortgaged       = 'mortgaged',
  Unmortgaged     = 'unmortgaged',
  AuctionStarted  = 'auction_started',
  AuctionBid      = 'auction_bid',
  AuctionWon      = 'auction_won',
  TradeProposed   = 'trade_proposed',
  TradeResolved   = 'trade_resolved',
  DebtIncurred    = 'debt_incurred',
  Bankrupted      = 'bankrupted',
  GameOver        = 'game_over',
}

export type JailExitMethod = 'fine' | 'card' | 'doubles';

export type GameEvent =
  | { type: GameEventType.TurnStarted;    playerId: string; playerName: string }
  | { type: GameEventType.RoundStarted;   roundNumber: number }
  | { type: GameEventType.DiceRolled;     playerId: string; playerName: string; die1: number; die2: number; isDoubles: boolean }
  | { type: GameEventType.PlayerMoved;    playerId: string; playerName: string; from: number; to: number; toName: string; passedGo: boolean; teleport: boolean }
  | { type: GameEventType.PassedGo;       playerId: string; playerName: string; amount: number }
  | { type: GameEventType.PropertyBought; playerId: string; playerName: string; position: number; propertyName: string; price: number }
  | { type: GameEventType.PropertySold;   playerId: string; playerName: string; position: number; propertyName: string; refund: number }
  | { type: GameEventType.RentPaid;       payerId: string; payerName: string; ownerId: string; ownerName: string; position: number; propertyName: string; amount: number }
  | { type: GameEventType.TaxPaid;        playerId: string; playerName: string; position: number; taxName: string; amount: number }
  | { type: GameEventType.CardDrawn;      playerId: string; playerName: string; cardKind: CardKind; text: string }
  | { type: GameEventType.CardResolved;   playerId: string; playerName: string; text: string }
  | { type: GameEventType.SentToJail;     playerId: string; playerName: string; reason: 'card' | 'corner' | 'doubles' }
  | { type: GameEventType.LeftJail;       playerId: string; playerName: string; method: JailExitMethod }
  | { type: GameEventType.HouseBuilt;     playerId: string; playerName: string; position: number; propertyName: string; cost: number }
  | { type: GameEventType.HotelBuilt;     playerId: string; playerName: string; position: number; propertyName: string; cost: number }
  | { type: GameEventType.HouseSold;      playerId: string; playerName: string; position: number; propertyName: string; refund: number }
  | { type: GameEventType.HotelSold;      playerId: string; playerName: string; position: number; propertyName: string; refund: number }
  | { type: GameEventType.Mortgaged;      playerId: string; playerName: string; position: number; propertyName: string; amount: number }
  | { type: GameEventType.Unmortgaged;    playerId: string; playerName: string; position: number; propertyName: string; cost: number }
  | { type: GameEventType.AuctionStarted; position: number; propertyName: string }
  | { type: GameEventType.AuctionBid;     playerId: string; playerName: string; amount: number }
  | { type: GameEventType.AuctionWon;     winnerId: string | null; winnerName: string; position: number; propertyName: string; amount: number }
  | { type: GameEventType.TradeProposed;  tradeId: string; proposerId: string; proposerName: string; targetId: string; targetName: string }
  | { type: GameEventType.TradeResolved;  tradeId: string; accepted: boolean }
  | { type: GameEventType.DebtIncurred;   debtorId: string; debtorName: string; creditorId: string | null; amount: number }
  | { type: GameEventType.Bankrupted;     playerId: string; playerName: string; creditorId: string | null }
  | { type: GameEventType.GameOver;       winnerId: string; winnerName: string };

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
  /** Machine-readable payload for EVENT-kind entries. Absent for chat/sticker. */
  event?:       GameEvent;
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
