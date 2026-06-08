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
  TurnStarted      = 'turn_started',
  TurnEnded        = 'turn_ended',
  RoundStarted     = 'round_started',
  DiceRolled       = 'dice_rolled',
  RolledDoubles    = 'rolled_doubles',
  PlayerMoved      = 'player_moved',
  PassedGo         = 'passed_go',
  PropertyBought   = 'property_bought',
  PropertySold     = 'property_sold',
  BuyDeclined      = 'buy_declined',
  RentPaid         = 'rent_paid',
  TaxPaid          = 'tax_paid',
  CardDrawn        = 'card_drawn',
  CardResolved     = 'card_resolved',
  SentToJail       = 'sent_to_jail',
  LeftJail         = 'left_jail',
  PlayerSurrendered = 'player_surrendered',
  TurnTimedOut     = 'turn_timed_out',
  HouseBuilt       = 'house_built',
  HotelBuilt       = 'hotel_built',
  HouseSold        = 'house_sold',
  HotelSold        = 'hotel_sold',
  Mortgaged        = 'mortgaged',
  Unmortgaged      = 'unmortgaged',
  AuctionStarted   = 'auction_started',
  AuctionBid       = 'auction_bid',
  AuctionWon       = 'auction_won',
  TradeProposed    = 'trade_proposed',
  TradeResolved    = 'trade_resolved',
  DebtIncurred     = 'debt_incurred',
  Bankrupted       = 'bankrupted',
  GameOver         = 'game_over',
}