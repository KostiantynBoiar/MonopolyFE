import type { GameEvent, LogEntry } from '../game-state';
import { LogKind } from '../game-state.enums';
import { renderEvent } from './format-event';

export { renderEvent };

let _seq = 0;

/**
 * Build an EVENT-kind LogEntry from a typed GameEvent.
 * Sets both the machine-readable `event` and the rendered `text`.
 * A monotonic suffix on the id avoids collisions when several events are
 * emitted within the same millisecond (e.g. a roll that moves and pays rent).
 */
export function makeEventEntry(event: GameEvent): LogEntry {
  return {
    id:   `log_${Date.now()}_${_seq++}`,
    kind: LogKind.EVENT,
    text: renderEvent(event),
    event,
    ts:   new Date().toISOString(),
  };
}

/** Append one or more typed events to a log array, returning a new array. */
export function appendEvents(log: LogEntry[], ...events: GameEvent[]): LogEntry[] {
  return events.length === 0 ? log : [...log, ...events.map(makeEventEntry)];
}
