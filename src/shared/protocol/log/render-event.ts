import type { GameEvent } from '../game-state';
import { GameEventType } from '../game-state.enums';

export type LogTranslator    = (key: string, values?: Record<string, string | number>) => string;
export type TileNameResolver = (position: number) => string;
export type CardTextResolver = (cardId: string, cardKind: string) => string;

/**
 * Render a machine-readable GameEvent to a localized string using the EventLog
 * translation namespace. Returns null for event types without a template so the
 * caller can fall back to the server-provided `entry.text`.
 */
export function renderGameEvent(
  event: GameEvent,
  t: LogTranslator,
  resolveTileName: TileNameResolver,
  resolveCardText: CardTextResolver,
): string | null {
  switch (event.type) {
    case GameEventType.PlayerMoved: {
      const tile = resolveTileName(event.tileId);
      return event.rolled != null
        ? t('playerMovedRolled', { player: event.playerName, rolled: event.rolled, tile })
        : t('playerMoved',       { player: event.playerName, tile });
    }

    case GameEventType.PassedGo:
      return t('passedGo', { player: event.playerName, amount: event.received });

    case GameEventType.RentPaid:
      return t('rentPaid', {
        player: event.playerName,
        amount: event.spent,
        tile:   resolveTileName(event.tileId),
      });

    case GameEventType.PropertyBought:
      return t('propertyBought', {
        player: event.playerName,
        amount: event.spent,
        tile:   resolveTileName(event.tileId),
      });

    case GameEventType.BuyDeclined:
      return t('buyDeclined', { player: event.playerName, tile: resolveTileName(event.tileId) });

    case GameEventType.RolledDoubles:
      return t('rolledDoubles', { player: event.playerName, streak: event.streak });

    case GameEventType.SentToJail: {
      const { playerName: player, reason } = event;
      if (reason === 'doubles')        return t('sentToJailDoubles', { player });
      if (reason === 'card')           return t('sentToJailCard',    { player });
      return t('sentToJailSpace', { player });
    }

    case GameEventType.TaxPaid:
      return t('taxPaid', {
        player: event.playerName,
        amount: event.spent,
        tile:   resolveTileName(event.tileId),
      });

    case GameEventType.TurnEnded:
      return t('turnEnded', { player: event.playerName });

    case GameEventType.CardDrawn:
      return t('cardDrawn', {
        player: event.playerName,
        card:   resolveCardText(event.cardId, event.cardKind),
      });

    case GameEventType.PlayerSurrendered:
      return event.reason === 'afk'
        ? t('playerSurrenderedAfk', { player: event.playerName })
        : t('playerSurrendered',    { player: event.playerName });

    case GameEventType.TurnTimedOut:
      return t('turnTimedOut', { player: event.playerName, strikes: event.strikes });

    default:
      return null;
  }
}
