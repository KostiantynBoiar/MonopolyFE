/**
 * Pure formatter: GameEvent → human-readable log line.
 *
 * The mock backend (and a real backend) store both the typed `event` and the
 * rendered `text` on each LogEntry. Keeping this a pure (event) => string means
 * the same event always renders the same way — independent of current state —
 * which is what makes the log replayable.
 */

import type { GameEvent } from '../game-state';
import { GameEventType } from '../game-state.enums';

const M = (n: number) => `M${n}`;

export function renderEvent(event: GameEvent): string {
  switch (event.type) {
    case GameEventType.TurnStarted:
      return `${event.playerName}'s turn.`;

    case GameEventType.RoundStarted:
      return `Round ${event.roundNumber}.`;

    case GameEventType.DiceRolled:
      return `${event.playerName} rolled ${event.die1} + ${event.die2} = ` +
        `${event.die1 + event.die2}${event.isDoubles ? ' (doubles!)' : ''}.`;

    case GameEventType.PlayerMoved:
      return `${event.playerName} moved to ${event.toName}.`;

    case GameEventType.PassedGo:
      return `${event.playerName} passed GO and collected ${M(event.amount)}.`;

    case GameEventType.PropertyBought:
      return `${event.playerName} bought ${event.propertyName} for ${M(event.price)}.`;

    case GameEventType.PropertySold:
      return `${event.playerName} sold ${event.propertyName} to the bank for ${M(event.refund)}.`;

    case GameEventType.RentPaid:
      return `${event.payerName} paid ${M(event.amount)} rent to ${event.ownerName} for ${event.propertyName}.`;

    case GameEventType.TaxPaid:
      return `${event.playerName} paid ${M(event.amount)} ${event.taxName}.`;

    case GameEventType.CardDrawn:
      return `${event.playerName} drew: "${event.text}"`;

    case GameEventType.CardResolved:
      return event.text;

    case GameEventType.SentToJail:
      return `${event.playerName} was sent to Jail.`;

    case GameEventType.LeftJail: {
      const how =
        event.method === 'fine'    ? 'paid M50 to get out of jail' :
        event.method === 'card'    ? 'used a Get Out of Jail Free card' :
                                     'rolled doubles and left jail';
      return `${event.playerName} ${how}.`;
    }

    case GameEventType.HouseBuilt:
      return `${event.playerName} built a house on ${event.propertyName} (${M(event.cost)}).`;

    case GameEventType.HotelBuilt:
      return `${event.playerName} upgraded ${event.propertyName} to a hotel (${M(event.cost)}).`;

    case GameEventType.HouseSold:
      return `${event.playerName} sold a house on ${event.propertyName} for ${M(event.refund)}.`;

    case GameEventType.HotelSold:
      return `${event.playerName} sold hotel on ${event.propertyName} for ${M(event.refund)}.`;

    case GameEventType.Mortgaged:
      return `${event.playerName} mortgaged ${event.propertyName} for ${M(event.amount)}.`;

    case GameEventType.Unmortgaged:
      return `${event.playerName} unmortgaged ${event.propertyName} for ${M(event.cost)}.`;

    case GameEventType.AuctionStarted:
      return `${event.propertyName} goes to auction!`;

    case GameEventType.AuctionBid:
      return `${event.playerName} bids ${M(event.amount)}.`;

    case GameEventType.AuctionWon:
      return event.winnerId
        ? `${event.winnerName} won the auction for ${M(event.amount)}.`
        : 'No bids. Property returns to the bank.';

    case GameEventType.TradeProposed:
      return `${event.proposerName} proposed a trade to ${event.targetName}.`;

    case GameEventType.TradeResolved:
      return event.accepted ? 'Trade accepted.' : 'Trade rejected.';

    case GameEventType.DebtIncurred:
      return `${event.debtorName} owes ${M(event.amount)} and must raise cash.`;

    case GameEventType.Bankrupted:
      return `${event.playerName} went bankrupt.`;

    case GameEventType.GameOver:
      return `${event.winnerName} wins the game!`;
  }
}
