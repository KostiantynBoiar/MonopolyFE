import type { TokenColor } from '@/features/player-panel';
import { CardKind, CardEffectType } from '@/features/card/card.enums';
import { TradeStatus } from '@/features/trade/trade.enums';
import { PropertyColor } from '@/features/game-board/game-board.enums';
import { DiceRoll } from '@/features/chat/chat.types';
export type { TokenColor };

// ======================================================
// ENUMS
// ======================================================

export enum GameStatus {
  Lobby = 'lobby',
  InProgress = 'in_progress',
  Finished = 'finished',
}

export enum TurnPhase {
  PreRoll = 'pre_roll',
  JailDecision = 'jail_decision',
  PostRoll = 'post_roll',
  MustPayRent = 'must_pay_rent',
  DrawingCard = 'drawing_card',
  Auction = 'auction',
  TradeNegotiation = 'trade_negotiation',
  BankruptResolution = 'bankrupt_resolution',
  GameOver = 'game_over',
}

export enum LogKind {
  Event = 'event',
  Chat = 'chat',
  Sticker = 'sticker',
}

export enum AdvanceToNearestSpaceType {
  Railroad = 'railroad',
  Utility = 'utility',
}

export enum BoardSpaceType {
  Go = 'go',
  Property = 'property',
  Railroad = 'railroad',
  Utility = 'utility',
  Chance = 'chance',
  CommunityChest = 'community_chest',
  IncomeTax = 'income_tax',
  LuxuryTax = 'luxury_tax',
  Jail = 'jail',
  FreeParking = 'free_parking',
  GoToJail = 'go_to_jail',
}

export enum AuctionTargetKind {
  Property = 'property',
  House = 'house',
  Hotel = 'hotel',
}

export enum DebtCreditorType {
  Bank = 'bank',
  Player = 'player',
}

// ======================================================
// COMMON
// ======================================================

export type IsoDateString = string;

// ======================================================
// BOARD DEFINITIONS (IMMUTABLE)
// ======================================================

export type PropertyDefinition = {
  position: number;
  name: string;

  color: PropertyColor;

  price: number;

  mortgageValue: number;

  houseCost: number;

  rents: {
    base: number;
    monopoly: number;
    oneHouse: number;
    twoHouses: number;
    threeHouses: number;
    fourHouses: number;
    hotel: number;
  };
};

export type RailroadDefinition = {
  position: number;
  name: string;
  price: number;
  mortgageValue: number;
};

export type UtilityDefinition = {
  position: number;
  name: string;
  price: number;
  mortgageValue: number;
};

export type BoardSpaceDefinition =
  | {
      position: number;
      type: BoardSpaceType.Property;
      property: PropertyDefinition;
    }
  | {
      position: number;
      type: BoardSpaceType.Railroad;
      railroad: RailroadDefinition;
    }
  | {
      position: number;
      type: BoardSpaceType.Utility;
      utility: UtilityDefinition;
    }
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
  position: number;

  ownerId: string | null;

  houses: 0 | 1 | 2 | 3 | 4;

  hotel: boolean;

  isMortgaged: boolean;
};

// ======================================================
// PLAYERS
// ======================================================

export type JailStatus = {
  attempts: number;
};

export type PlayerState = {
  id: string;

  userId: string;

  displayName: string;

  token: TokenColor;

  avatarUrl: string | null;

  turnOrder: number;

  position: number;

  balance: number;

  ownedPositions: number[];

  getOutOfJailCards: number;

  jailStatus: JailStatus | null;

  doublesStreak: number;

  isBankrupt: boolean;

  isConnected: boolean;
};

// ======================================================
// TURN
// ======================================================

export type ActionSet = {
  canRoll: boolean;
  canBuy: boolean;
  canBuild: boolean;
  canSellBuildings: boolean;
  canMortgage: boolean;
  canUnmortgage: boolean;
  canTrade: boolean;
  canEndTurn: boolean;
  canPayJailFine: boolean;
  canUseJailCard: boolean;
  canBid: boolean;
};

export type TurnState = {
  phase: TurnPhase;

  currentPlayerId: string;

  turnNumber: number;

  roundNumber: number;

  diceRoll: DiceRoll | null;

  extraTurn: boolean;

  actionsAvailable: ActionSet;
};

// ======================================================
// DEBT
// ======================================================

export type DebtState = {
  debtorId: string;

  creditorType: DebtCreditorType;

  creditorId: string | null;

  amount: number;
};

// ======================================================
// AUCTIONS
// ======================================================

export type AuctionBid = {
  playerId: string;
  amount: number;
};

export type AuctionTarget =
  | {
      kind: AuctionTargetKind.Property;
      position: number;
    }
  | {
      kind: AuctionTargetKind.House;
    }
  | {
      kind: AuctionTargetKind.Hotel;
    };

export type AuctionState = {
  target: AuctionTarget;

  bids: AuctionBid[];

  highestBid: number;

  highestBidderId: string | null;

  timeRemainingMs: number;
};

// ======================================================
// TRADING
// ======================================================

export type TradeOffer = {
  money: number;

  positions: number[];

  getOutOfJailCards: number;
};

export type TradeState = {
  id: string;

  proposerId: string;

  targetId: string;

  proposerOffer: TradeOffer;

  targetRequest: TradeOffer;

  status: TradeStatus;

  expiresAt: IsoDateString;
};

// ======================================================
// CARDS
// ======================================================

export type CardEffect =
  | {
      type: CardEffectType.ADVANCE_TO;
      position: number;
      collectGoBonus: boolean;
    }
  | {
      type: CardEffectType.ADVANCE_TO_NEAREST;
      spaceType: AdvanceToNearestSpaceType;
      payDouble: boolean;
    }
  | {
      type: CardEffectType.GO_TO_JAIL;
    }
  | {
      type: CardEffectType.GO_BACK;
      spaces: number;
    }
  | {
      type: CardEffectType.COLLECT;
      amount: number;
    }
  | {
      type: CardEffectType.PAY;
      amount: number;
    }
  | {
      type: CardEffectType.COLLECT_FROM_EACH_PLAYER;
      amount: number;
    }
  | {
      type: CardEffectType.PAY_EACH_PLAYER;
      amount: number;
    }
  | {
      type: CardEffectType.GET_OUT_OF_JAIL_FREE;
    }
  | {
      type: CardEffectType.REPAIRS;
      perHouse: number;
      perHotel: number;
    };

export type ActiveCard = {
  id: string;

  kind: CardKind;

  text: string;

  effect: CardEffect;

  drawerId: string;
};

export type DeckState = {
  chance: string[];

  communityChest: string[];

  discardedChance: string[];

  discardedCommunityChest: string[];
};

// ======================================================
// BANKRUPTCY
// ======================================================

export type BankruptcyState = {
  playerId: string;

  creditorType: DebtCreditorType;

  creditorId: string | null;
};

// ======================================================
// LOG
// ======================================================

export type LogEntry = {
  id: string;

  kind: LogKind;

  playerId?: string;

  playerName?: string;

  playerToken?: TokenColor;

  text: string;

  stickerUrl?: string;

  ts: IsoDateString;
};

// ======================================================
// ROOT GAME STATE
// ======================================================

export type GameState = {
  gameId: string;

  sessionCode: string;

  status: GameStatus;

  createdAt: IsoDateString;

  startedAt: IsoDateString | null;

  finishedAt: IsoDateString | null;

  winnerId: string | null;

  players: PlayerState[];

  turn: TurnState;

  bank: BankState;

  spaces: PropertyState[];

  debt: DebtState | null;

  auction: AuctionState | null;

  trade: TradeState | null;

  activeCard: ActiveCard | null;

  bankruptcy: BankruptcyState | null;

  decks: DeckState;

  log: LogEntry[];
};
