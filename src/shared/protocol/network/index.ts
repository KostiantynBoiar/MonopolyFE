/**
 * Game-level server messages.
 *
 * These are the payloads that arrive inside WS frames (see events.ts for the
 * transport-level envelope). When the real backend ships, the GameSocket will
 * deserialise incoming frames and emit typed ServerMessages for the frontend
 * to process — the same types, the same pipeline, no code changes required.
 *
 * Processing flow:
 *   WS frame → deserialise → ServerMessage → applyMessage → GameState
 */

import type { GameState, LogEntry } from '../game-state';
import type { ActionSet } from '../permissions';

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
 * Full game state replacement.
 * Sent on connect and after any command that produces a non-trivial state change.
 * `permissions` mirrors `game.turn.actionsAvailable` but is kept separate so the
 * frontend can apply permissions without re-parsing the whole state tree.
 */
export type SnapshotMessage = {
  type:        ServerEventType.Snapshot;
  seq:         number;
  game:        GameState;
  permissions: ActionSet;
};

/**
 * Shallow-merge partial update.
 * Used for cheap server-side ticks (e.g. auction countdown).
 * Deep fields (players[], spaces[]) should use Snapshot instead.
 */
export type PatchMessage = {
  type:  ServerEventType.Patch;
  seq:   number;
  delta: Partial<GameState>;
};

/**
 * New log entries only.
 * The server may send these between snapshots to avoid re-sending the full log.
 */
export type LogMessage = {
  type:    ServerEventType.Log;
  seq:     number;
  entries: LogEntry[];
};

/**
 * Command rejected or server fault.
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
// PURE REDUCER — apply a message to the current state
// ======================================================

/**
 * Pure function: folds a ServerMessage into the current GameState.
 * Use with React's functional updater: `setGameState(prev => applyMessage(prev, msg))`.
 * ErrorMessage produces no state change — callers decide how to surface it.
 */
export function applyMessage(state: GameState, msg: ServerMessage): GameState {
  switch (msg.type) {
    case ServerEventType.Snapshot:
      return msg.game;

    case ServerEventType.Patch:
      return { ...state, ...msg.delta };

    case ServerEventType.Log:
      return { ...state, log: [...state.log, ...msg.entries] };

    case ServerEventType.Error:
      return state;
  }
}
