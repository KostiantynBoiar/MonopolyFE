/**
 * Command serializer — maps a frontend ClientCommand to the backend WebSocket
 * message `{ type, payload }` (see MonopolyBE gateway/handlers/game.py + HANDLERS).
 *
 * Several FE commands have no direct backend command and are remapped:
 *   - RollInJail   → game.roll_dice   (a jail roll is the normal roll action)
 *   - BuildHotel   → game.build_house (the 5th house becomes a hotel server-side)
 *   - SellHotel    → game.sell_house
 *   - Accept/Reject/Counter trade → game.respond_trade with a `response` enum
 *
 * Commands with NO backend equivalent return null (the caller drops them):
 *   - SellProperty (no sell-to-bank command)
 *   - PayDebt      (rent is auto-deducted; the player just ends turn)
 *   - ResolveCard  (cards are auto-resolved by the engine)
 */

import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import type { TradeOffer } from '@/shared/protocol/game-state';

export interface WireCommand {
  type: string;
  payload: Record<string, unknown>;
}

function offerToWire(offer: TradeOffer): Record<string, unknown> {
  return {
    money: offer.money,
    positions: offer.positions,
    get_out_of_jail_cards: offer.getOutOfJailCards,
  };
}

/**
 * Returns the backend wire command, or null when the command has no server
 * equivalent and should be handled purely client-side (or dropped).
 */
export function serializeCommand(cmd: ClientCommand): WireCommand | null {
  switch (cmd.type) {
    case CommandType.RollDice:
    case CommandType.RollInJail:
      return { type: 'game.roll_dice', payload: {} };

    case CommandType.EndTurn:
      return { type: 'game.end_turn', payload: {} };

    case CommandType.BuyProperty:
      return { type: 'game.buy_property', payload: { position: cmd.position } };

    // Declining to buy opens the auction on the backend.
    case CommandType.PassBuy:
      return { type: 'game.pass_buy', payload: {} };

    case CommandType.BuildHouse:
    case CommandType.BuildHotel:
      return { type: 'game.build_house', payload: { position: cmd.position } };

    case CommandType.SellHouse:
    case CommandType.SellHotel:
      return { type: 'game.sell_house', payload: { position: cmd.position } };

    case CommandType.Mortgage:
      return { type: 'game.mortgage', payload: { position: cmd.position } };

    case CommandType.Unmortgage:
      return { type: 'game.unmortgage', payload: { position: cmd.position } };

    case CommandType.StartTrade:
      return {
        type: 'game.propose_trade',
        payload: {
          target_id: cmd.targetId,
          proposer_offer: offerToWire(cmd.offer),
          target_request: offerToWire(cmd.request),
        },
      };

    case CommandType.AcceptTrade:
      return { type: 'game.respond_trade', payload: { trade_id: cmd.tradeId, response: 'accept' } };

    case CommandType.RejectTrade:
      return { type: 'game.respond_trade', payload: { trade_id: cmd.tradeId, response: 'reject' } };

    case CommandType.CounterTrade:
      return {
        type: 'game.respond_trade',
        payload: {
          trade_id: cmd.tradeId,
          response: 'counter',
          counter_offer: offerToWire(cmd.offer),
        },
      };

    case CommandType.BidAuction:
      return { type: 'game.place_bid', payload: { amount: cmd.amount } };

    case CommandType.PayJailFine:
      return { type: 'game.pay_jail_fine', payload: {} };

    case CommandType.UseJailCard:
      return { type: 'game.use_jail_card', payload: {} };

    case CommandType.DeclareBankruptcy:
      return { type: 'game.declare_bankruptcy', payload: {} };

    // Paying debt = ending the turn; the backend auto-deducts once the player
    // has raised enough cash and calls end_turn.
    case CommandType.PayDebt:
      return { type: 'game.end_turn', payload: {} };

    // No backend equivalent — handled client-side or dropped.
    case CommandType.SellProperty:
    case CommandType.ResolveCard:
      return null;

    default:
      return null;
  }
}
