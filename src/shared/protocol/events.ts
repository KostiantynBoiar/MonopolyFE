import type { GameState } from './game-state';
import type { ActionSet } from './permissions';

// ======================================================
// WS ENVELOPE
// ======================================================

export const WS_PROTOCOL_VERSION = 1 as const;

export type WsEnvelope<T extends string, P> = {
  v:                typeof WS_PROTOCOL_VERSION;
  type:             T;
  ts:               string;
  seq?:             number;
  idempotency_key?: string;
  payload:          P;
};

// ======================================================
// EVENT TYPES (server → client)
// ======================================================

export enum ServerEventType {
  // Connection handshake
  Welcome = 'system.welcome',
  Ping    = 'connection.ping',
  Error   = 'system.error',

  // Game state
  GameSnapshot = 'game.snapshot',

  // Permissions update (may arrive without a full snapshot)
  PermissionsUpdated = 'game.permissions_updated',
}

// ======================================================
// PAYLOADS
// ======================================================

export type WelcomePayload = {
  session_id:     string;
  your_seq_start: number;
};

export type ErrorPayload = {
  code:    'malformed' | 'unsupported_version' | 'unknown_type' | 'unauthorized' | 'not_member' | 'rate_limited' | 'internal';
  message: string;
  ref_seq?: number;
};

export type GameSnapshotPayload = {
  state:       GameState;
  permissions: ActionSet;
};

export type PermissionsUpdatedPayload = {
  permissions: ActionSet;
};

// ======================================================
// TYPED EVENT MESSAGES
// ======================================================

export type WsWelcome            = WsEnvelope<ServerEventType.Welcome,              WelcomePayload>;
export type WsPing               = WsEnvelope<ServerEventType.Ping,                 Record<string, never>>;
export type WsError              = WsEnvelope<ServerEventType.Error,                ErrorPayload>;
export type WsGameSnapshot       = WsEnvelope<ServerEventType.GameSnapshot,         GameSnapshotPayload>;
export type WsPermissionsUpdated = WsEnvelope<ServerEventType.PermissionsUpdated,   PermissionsUpdatedPayload>;

export type ServerEvent =
  | WsWelcome
  | WsPing
  | WsError
  | WsGameSnapshot
  | WsPermissionsUpdated;
