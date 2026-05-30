import type { TradeOffer } from './game-state';

// ======================================================
// COMMAND TYPES (client → server)
// ======================================================

export enum CommandType {
  RollDice     = 'roll_dice',
  BuyProperty  = 'buy_property',
  PassBuy      = 'pass_buy',
  BuildHouse   = 'build_house',
  SellHouse    = 'sell_house',
  Mortgage     = 'mortgage',
  Unmortgage   = 'unmortgage',
  PayJailFine  = 'pay_jail_fine',
  UseJailCard  = 'use_jail_card',
  EndTurn      = 'end_turn',
  ProposeTrade = 'propose_trade',
  RespondTrade = 'respond_trade',
  PlaceBid     = 'place_bid',
  SendChat     = 'send_chat',
  SendSticker  = 'send_sticker',
}

export type TradeResponse = 'accept' | 'reject' | 'counter';

// ======================================================
// COMMAND PAYLOADS
// ======================================================

export type RollDiceCommand     = { type: CommandType.RollDice };
export type BuyPropertyCommand  = { type: CommandType.BuyProperty;  position: number };
export type PassBuyCommand      = { type: CommandType.PassBuy };
export type BuildHouseCommand   = { type: CommandType.BuildHouse;   position: number };
export type SellHouseCommand    = { type: CommandType.SellHouse;    position: number };
export type MortgageCommand     = { type: CommandType.Mortgage;     position: number };
export type UnmortgageCommand   = { type: CommandType.Unmortgage;   position: number };
export type PayJailFineCommand  = { type: CommandType.PayJailFine };
export type UseJailCardCommand  = { type: CommandType.UseJailCard };
export type EndTurnCommand      = { type: CommandType.EndTurn };

export type ProposeTradeCommand = {
  type:          CommandType.ProposeTrade;
  targetId:      string;
  proposerOffer: TradeOffer;
  targetRequest: TradeOffer;
};

export type RespondTradeCommand = {
  type:          CommandType.RespondTrade;
  tradeId:       string;
  response:      TradeResponse;
  counterOffer?: TradeOffer;
};

export type PlaceBidCommand   = { type: CommandType.PlaceBid;    amount: number };
export type SendChatCommand   = { type: CommandType.SendChat;    text: string };
export type SendStickerCommand = { type: CommandType.SendSticker; stickerUrl: string };

// ======================================================
// DISCRIMINATED UNION
// ======================================================

export type GameCommand =
  | RollDiceCommand
  | BuyPropertyCommand
  | PassBuyCommand
  | BuildHouseCommand
  | SellHouseCommand
  | MortgageCommand
  | UnmortgageCommand
  | PayJailFineCommand
  | UseJailCardCommand
  | EndTurnCommand
  | ProposeTradeCommand
  | RespondTradeCommand
  | PlaceBidCommand
  | SendChatCommand
  | SendStickerCommand;
