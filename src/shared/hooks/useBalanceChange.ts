'use client';

import { useEffect, useRef } from 'react';
import type { GameEvent, LogEntry } from '@/shared/protocol/game-state';
import { GameEventType, LogKind } from '@/shared/protocol/game-state.enums';

interface PlayerWithBalance {
  id: string;
  balance: number;
}

export interface BalanceChange {
  playerId: string;
  delta: number;
}

function getEventBalanceChanges(event: GameEvent): BalanceChange[] {
  switch (event.type) {
    case GameEventType.PassedGo:
      return [{ playerId: event.playerId, delta: event.received }];

    case GameEventType.PropertyBought:
    case GameEventType.RentPaid:
    case GameEventType.TaxPaid:
      return [{ playerId: event.playerId, delta: -event.spent }];

    case GameEventType.PropertySold:
    case GameEventType.HouseSold:
    case GameEventType.HotelSold:
      return [{ playerId: event.playerId, delta: event.refund }];

    case GameEventType.HouseBuilt:
    case GameEventType.HotelBuilt:
      return [{ playerId: event.playerId, delta: -event.cost }];

    case GameEventType.Mortgaged:
      return [{ playerId: event.playerId, delta: event.amount }];

    case GameEventType.Unmortgaged:
      return [{ playerId: event.playerId, delta: -event.cost }];

    case GameEventType.AuctionWon:
      return event.winnerId ? [{ playerId: event.winnerId, delta: -event.amount }] : [];

    default:
      return [];
  }
}

function getLogBalanceChanges(entries: LogEntry[]): BalanceChange[] {
  return entries.flatMap((entry) => (
    entry.kind === LogKind.EVENT && entry.event ? getEventBalanceChanges(entry.event) : []
  ));
}

/**
 * Fires `onChange` with every balance delta since the previous render.
 * Skips the initial population (no previous value → no change emitted).
 * When log entries are supplied, monetary events are preferred over final balance
 * diffs so offsetting changes in the same snapshot still animate.
 * The callback ref is kept fresh so callers don't need to wrap it in useCallback.
 */
export function useBalanceChange(
  players: PlayerWithBalance[],
  onChange: (changes: BalanceChange[]) => void,
  logEntries?: LogEntry[],
): void {
  const prevRef = useRef<Map<string, number>>(new Map());
  const seenLogIdsRef = useRef<Set<string> | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const hasPreviousBalances = prevRef.current.size > 0;
    const newLogEntries = logEntries && seenLogIdsRef.current && hasPreviousBalances
      ? logEntries.filter((entry) => !seenLogIdsRef.current?.has(entry.id))
      : [];
    const eventChanges = getLogBalanceChanges(newLogEntries);
    const eventPlayerIds = new Set(eventChanges.map((change) => change.playerId));
    const changes: BalanceChange[] = [...eventChanges];

    for (const { id, balance } of players) {
      const prev = prevRef.current.get(id);
      if (prev !== undefined && prev !== balance && !eventPlayerIds.has(id)) {
        changes.push({ playerId: id, delta: balance - prev });
      }
      prevRef.current.set(id, balance);
    }

    if (logEntries) {
      seenLogIdsRef.current = new Set(logEntries.map((entry) => entry.id));
    }

    if (changes.length > 0) {
      onChangeRef.current(changes);
    }
  }, [players, logEntries]);
}
