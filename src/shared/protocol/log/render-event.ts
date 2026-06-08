import type { GameEvent } from '../game-state';
import { GameEventType } from '../game-state.enums';

export type LogTranslator    = (key: string, values?: Record<string, string | number>) => string;
export type TileNameResolver = (position: number) => string;
export type CardTextResolver = (cardId: string, cardKind: string) => string;

/** Access a raw backend field on an event (mapEvent spreads the entire wire payload). */
function field<T>(event: GameEvent, key: string): T {
  return (event as unknown as Record<string, unknown>)[key] as T;
}

/**
 * Render a machine-readable GameEvent to a localized string using the EventLog
 * translation namespace. Returns null for event types without a template so the
 * caller can fall back to the server-provided `entry.text`.
 *
 * Field access uses the raw backend payload keys (preserved via spread in mapEvent)
 * rather than the FE camelCase aliases, since some backend fields have no alias.
 */
export function renderGameEvent(
  event: GameEvent,
  t: LogTranslator,
  resolveTileName: TileNameResolver,
  resolveCardText: CardTextResolver,
): string | null {
  const player = field<string>(event, 'playerName');

  switch (event.type) {
    case GameEventType.PlayerMoved: {
      const tileId = field<number>(event, 'tile_id');
      const rolled = field<number | undefined>(event, 'rolled');
      const tile   = resolveTileName(tileId);
      return rolled != null
        ? t('playerMovedRolled', { player, rolled, tile })
        : t('playerMoved', { player, tile });
    }

    case GameEventType.PassedGo: {
      const amount = field<number>(event, 'received');
      return t('passedGo', { player, amount });
    }

    case GameEventType.RentPaid: {
      const tileId = field<number>(event, 'tile_id');
      const amount = field<number>(event, 'spent');
      const tile   = resolveTileName(tileId);
      return t('rentPaid', { player, amount, tile });
    }

    case GameEventType.PropertyBought: {
      const tileId = field<number>(event, 'tile_id');
      const amount = field<number>(event, 'spent');
      const tile   = resolveTileName(tileId);
      return t('propertyBought', { player, amount, tile });
    }

    case GameEventType.BuyDeclined: {
      const tileId = field<number>(event, 'tile_id');
      const tile   = resolveTileName(tileId);
      return t('buyDeclined', { player, tile });
    }

    case GameEventType.RolledDoubles: {
      const streak = field<number>(event, 'streak');
      return t('rolledDoubles', { player, streak });
    }

    case GameEventType.SentToJail: {
      const reason = field<string>(event, 'reason');
      if (reason === 'doubles')        return t('sentToJailDoubles', { player });
      if (reason === 'card')           return t('sentToJailCard', { player });
      return t('sentToJailSpace', { player });
    }

    case GameEventType.TaxPaid: {
      const tileId = field<number>(event, 'tile_id');
      const amount = field<number>(event, 'spent');
      const tile   = resolveTileName(tileId);
      return t('taxPaid', { player, amount, tile });
    }

    case GameEventType.TurnEnded: {
      return t('turnEnded', { player });
    }

    case GameEventType.CardDrawn: {
      const cardId   = field<string>(event, 'card_id');
      const cardKind = field<string>(event, 'card_kind');
      const card     = resolveCardText(cardId, cardKind);
      return t('cardDrawn', { player, card });
    }

    case GameEventType.PlayerSurrendered: {
      const reason = field<string>(event, 'reason');
      return reason === 'afk'
        ? t('playerSurrenderedAfk', { player })
        : t('playerSurrendered', { player });
    }

    case GameEventType.TurnTimedOut: {
      const strikes = field<number>(event, 'strikes');
      return t('turnTimedOut', { player, strikes });
    }

    default:
      return null;
  }
}
