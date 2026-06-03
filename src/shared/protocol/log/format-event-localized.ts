/**
 * Localized event renderer — the canonical display path for GameEvent → string.
 *
 * Accepts the typed GameEvent and a next-intl `t` function pre-scoped to the
 * 'EventLog' namespace. Returns a translated, interpolated string.
 *
 * format-event.ts is the deprecated plain-EN fallback used only by the mock
 * backend's makeEventEntry(); this file is used for all UI rendering.
 */

import type { GameEvent } from '../game-state';
import { GameEventType } from '../game-state.enums';

type TFn = (key: string, values?: Record<string, string | number | Date>) => string;

const M = (n: number) => `M${n}`;

export function renderEventLocalized(
  event: GameEvent,
  t: TFn,
  getPositionName: (pos: number) => string = (pos) => `${pos}`,
): string {
  switch (event.type) {
    case GameEventType.TurnStarted:
      return t('turn_started', { playerName: event.playerName });

    case GameEventType.RoundStarted:
      return t('round_started', { roundNumber: event.roundNumber });

    case GameEventType.DiceRolled:
      return t('dice_rolled', {
        playerName: event.playerName,
        die1:       event.die1,
        die2:       event.die2,
        total:      event.die1 + event.die2,
        doubles:    event.isDoubles ? 'yes' : 'no',
      });

    case GameEventType.PlayerMoved:
      return t('player_moved', { playerName: event.playerName, toName: getPositionName(event.to) });

    case GameEventType.PassedGo:
      return t('passed_go', { playerName: event.playerName, amount: M(event.amount) });

    case GameEventType.PropertyBought:
      return t('property_bought', { playerName: event.playerName, propertyName: event.propertyName, price: M(event.price) });

    case GameEventType.PropertySold:
      return t('property_sold', { playerName: event.playerName, propertyName: event.propertyName, refund: M(event.refund) });

    case GameEventType.RentPaid:
      return t('rent_paid', { payerName: event.payerName, amount: M(event.amount), ownerName: event.ownerName, propertyName: event.propertyName });

    case GameEventType.TaxPaid:
      return t('tax_paid', { playerName: event.playerName, amount: M(event.amount), taxName: event.taxName });

    case GameEventType.CardDrawn:
      return t('card_drawn', { playerName: event.playerName, text: event.text });

    case GameEventType.CardResolved:
      return event.text;

    case GameEventType.SentToJail:
      return t('sent_to_jail', { playerName: event.playerName });

    case GameEventType.LeftJail:
      return t('left_jail', { playerName: event.playerName, method: event.method });

    case GameEventType.HouseBuilt:
      return t('house_built', { playerName: event.playerName, propertyName: event.propertyName, cost: M(event.cost) });

    case GameEventType.HotelBuilt:
      return t('hotel_built', { playerName: event.playerName, propertyName: event.propertyName, cost: M(event.cost) });

    case GameEventType.HouseSold:
      return t('house_sold', { playerName: event.playerName, propertyName: event.propertyName, refund: M(event.refund) });

    case GameEventType.HotelSold:
      return t('hotel_sold', { playerName: event.playerName, propertyName: event.propertyName, refund: M(event.refund) });

    case GameEventType.Mortgaged:
      return t('mortgaged', { playerName: event.playerName, propertyName: event.propertyName, amount: M(event.amount) });

    case GameEventType.Unmortgaged:
      return t('unmortgaged', { playerName: event.playerName, propertyName: event.propertyName, cost: M(event.cost) });

    case GameEventType.AuctionStarted:
      return t('auction_started', { propertyName: event.propertyName });

    case GameEventType.AuctionBid:
      return t('auction_bid', { playerName: event.playerName, amount: M(event.amount) });

    case GameEventType.AuctionWon:
      return t('auction_won', { haswinner: event.winnerId ? 'yes' : 'no', winnerName: event.winnerName, amount: M(event.amount) });

    case GameEventType.TradeProposed:
      return t('trade_proposed', { proposerName: event.proposerName, targetName: event.targetName });

    case GameEventType.TradeResolved:
      return t('trade_resolved', { accepted: event.accepted ? 'yes' : 'no' });

    case GameEventType.DebtIncurred:
      return t('debt_incurred', { debtorName: event.debtorName, amount: M(event.amount) });

    case GameEventType.Bankrupted:
      return t('bankrupted', { playerName: event.playerName });

    case GameEventType.GameOver:
      return t('game_over', { winnerName: event.winnerName });

    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn('[EventLog] unhandled event type:', (event as { type: string }).type);
      }
      return (event as { text?: string }).text ?? '';
  }
}
