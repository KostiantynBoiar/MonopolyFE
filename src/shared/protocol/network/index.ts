/**
 * Game-level server messages.
 *
 * Processing flow:
 *   WS frame → deserialise → ServerMessage → applyMessage → GameSnapshot
 */

import type { GameState, LogEntry } from '../game-state';
import type { GameSnapshot, PlayerPermissions } from '../permissions';

// ======================================================
// EVENT TYPES
// ======================================================

export enum ServerEventType {
  Snapshot = 'game.snapshot',
  Patch    = 'game.patch',
  Log      = 'game.log',
  Error    = 'game.error',
}

// ======================================================
// MESSAGE SHAPES
// ======================================================

/**
 * Full state replacement. Sent on connect and after command processing.
 * Permissions are sent separately so they can update without re-parsing the whole state tree.
 */
export type SnapshotMessage = {
  type:        ServerEventType.Snapshot;
  seq:         number;
  game:        GameState;
  permissions: PlayerPermissions;
};

/**
 * Shallow-merge partial update.
 * Used for cheap server ticks (e.g. auction countdown). Deep fields use Snapshot.
 */
export type PatchMessage = {
  type:  ServerEventType.Patch;
  seq:   number;
  delta: Partial<GameState>;
};

/**
 * Append-only log entries between snapshots.
 */
export type LogMessage = {
  type:    ServerEventType.Log;
  seq:     number;
  entries: LogEntry[];
};

/**
 * Command rejected or server fault. No state change; caller surfaces the error.
 */
export type ErrorMessage = {
  type:    ServerEventType.Error;
  code:    'invalid_command' | 'not_your_turn' | 'insufficient_funds' | 'internal';
  message: string;
  refSeq?: number;
};

// ======================================================
// DISCRIMINATED UNION
// ======================================================

export type ServerMessage =
  | SnapshotMessage
  | PatchMessage
  | LogMessage
  | ErrorMessage;

// ======================================================
// PURE REDUCER
// ======================================================

/**
 * Folds a ServerMessage into the current GameSnapshot.
 * Use as: `setSnapshot(prev => applyMessage(prev, msg))`.
 * ErrorMessage leaves snapshot unchanged — callers decide how to surface it.
 */
export function applyMessage(snapshot: GameSnapshot, msg: ServerMessage): GameSnapshot {
  switch (msg.type) {
    case ServerEventType.Snapshot:
      return { game: msg.game, permissions: msg.permissions };

    case ServerEventType.Patch:
      return { ...snapshot, game: { ...snapshot.game, ...msg.delta } };

    case ServerEventType.Log:
      return {
        ...snapshot,
        game: { ...snapshot.game, log: [...snapshot.game.log, ...msg.entries] },
      };

    case ServerEventType.Error:
      return snapshot;
  }
}
