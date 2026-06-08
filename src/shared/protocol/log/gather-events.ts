import type { GameEvent } from '../game-state';
import { GameEventType } from '../game-state.enums';

export interface EventPlayer {
  id:   string;
  name: string;
}

/**
 * Structured metadata extracted from a typed GameEvent.
 *
 * - `players`      — every player entity involved (one for most events, two for
 *                    RentPaid / TradeProposed, zero for RoundStarted / AuctionStarted / TradeResolved)
 * - `amounts`      — every monetary value present (price, refund, cost, amount)
 * - `propertyName` — the board space name when the event concerns a property, else null
 */
export interface EventMeta {
  players:      EventPlayer[];
  amounts:      number[];
  propertyName: string | null;
}

function player(id: string, name: string): EventPlayer {
  return { id, name };
}

/** Extract all display entities from a GameEvent in a single typed call. */
export function gatherEventMeta(event: GameEvent): EventMeta {
  switch (event.type) {
    case GameEventType.TurnStarted:
    case GameEventType.TurnEnded:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.RoundStarted:
      return { players: [], amounts: [], propertyName: null };

    case GameEventType.DiceRolled:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.RolledDoubles:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.PlayerMoved:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.PassedGo:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.received], propertyName: null };

    case GameEventType.PropertyBought:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.spent], propertyName: null };

    case GameEventType.PropertySold:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.refund], propertyName: event.propertyName };

    case GameEventType.BuyDeclined:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.RentPaid:
      return {
        players: [player(event.playerId, event.playerName), player(event.opponentId, '')],
        amounts: [event.spent],
        propertyName: null,
      };

    case GameEventType.TaxPaid:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.spent], propertyName: null };

    case GameEventType.CardDrawn:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.CardResolved:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.SentToJail:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.LeftJail:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.PlayerSurrendered:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.TurnTimedOut:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.HouseBuilt:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.cost], propertyName: event.propertyName };

    case GameEventType.HotelBuilt:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.cost], propertyName: event.propertyName };

    case GameEventType.HouseSold:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.refund], propertyName: event.propertyName };

    case GameEventType.HotelSold:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.refund], propertyName: event.propertyName };

    case GameEventType.Mortgaged:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.amount], propertyName: event.propertyName };

    case GameEventType.Unmortgaged:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.cost], propertyName: event.propertyName };

    case GameEventType.AuctionStarted:
      return { players: [], amounts: [], propertyName: event.propertyName };

    case GameEventType.AuctionBid:
      return { players: [player(event.playerId, event.playerName)], amounts: [event.amount], propertyName: null };

    case GameEventType.AuctionWon:
      return {
        players: event.winnerId ? [player(event.winnerId, event.winnerName)] : [],
        amounts: [event.amount],
        propertyName: event.propertyName,
      };

    case GameEventType.TradeProposed:
      return {
        players: [player(event.proposerId, event.proposerName), player(event.targetId, event.targetName)],
        amounts: [],
        propertyName: null,
      };

    case GameEventType.TradeResolved:
      return { players: [], amounts: [], propertyName: null };

    case GameEventType.DebtIncurred:
      return { players: [player(event.debtorId, event.debtorName)], amounts: [event.amount], propertyName: null };

    case GameEventType.Bankrupted:
      return { players: [player(event.playerId, event.playerName)], amounts: [], propertyName: null };

    case GameEventType.GameOver:
      return { players: [player(event.winnerId, event.winnerName)], amounts: [], propertyName: null };
  }
}
