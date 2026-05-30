import type { TradeOffer } from './game-state';

// ======================================================
// COMMAND TYPES (client → server)
// ======================================================

export enum CommandType {
  RollDice    = 'roll_dice',
  EndTurn     = 'end_turn',

  BuyProperty = 'buy_property',

  BuildHouse  = 'build_house',
  BuildHotel  = 'build_hotel',

  SellHouse   = 'sell_house',
  SellHotel   = 'sell_hotel',

  Mortgage    = 'mortgage',
  Unmortgage  = 'unmortgage',

  StartTrade  = 'start_trade',
  AcceptTrade = 'accept_trade',
  RejectTrade = 'reject_trade',

  BidAuction  = 'bid_auction',

  PayJailFine = 'pay_jail_fine',
  UseJailCard = 'use_jail_card',
  RollInJail  = 'roll_in_jail',

  ResolveCard = 'resolve_card',
}

// ======================================================
// COMMAND PAYLOADS
// ======================================================

export type RollDiceCommand    = { type: CommandType.RollDice };
export type EndTurnCommand     = { type: CommandType.EndTurn };

export type BuyPropertyCommand = { type: CommandType.BuyProperty; position: number };

export type BuildHouseCommand  = { type: CommandType.BuildHouse;  position: number };
export type BuildHotelCommand  = { type: CommandType.BuildHotel;  position: number };

export type SellHouseCommand   = { type: CommandType.SellHouse;   position: number };
export type SellHotelCommand   = { type: CommandType.SellHotel;   position: number };

export type MortgageCommand    = { type: CommandType.Mortgage;    position: number };
export type UnmortgageCommand  = { type: CommandType.Unmortgage;  position: number };

export type StartTradeCommand  = {
  type:         CommandType.StartTrade;
  targetId:     string;
  offer:        TradeOffer;   // what the proposer gives
  request:      TradeOffer;   // what the proposer wants
};
export type AcceptTradeCommand = { type: CommandType.AcceptTrade; tradeId: string };
export type RejectTradeCommand = { type: CommandType.RejectTrade; tradeId: string };

export type BidAuctionCommand  = { type: CommandType.BidAuction;  amount: number };

export type PayJailFineCommand = { type: CommandType.PayJailFine };
export type UseJailCardCommand = { type: CommandType.UseJailCard };
export type RollInJailCommand  = { type: CommandType.RollInJail };
export type ResolveCardCommand = { type: CommandType.ResolveCard };

// ======================================================
// DISCRIMINATED UNION
// ======================================================

export type ClientCommand =
  | RollDiceCommand
  | EndTurnCommand
  | BuyPropertyCommand
  | BuildHouseCommand
  | BuildHotelCommand
  | SellHouseCommand
  | SellHotelCommand
  | MortgageCommand
  | UnmortgageCommand
  | StartTradeCommand
  | AcceptTradeCommand
  | RejectTradeCommand
  | BidAuctionCommand
  | PayJailFineCommand
  | UseJailCardCommand
  | RollInJailCommand
  | ResolveCardCommand;
