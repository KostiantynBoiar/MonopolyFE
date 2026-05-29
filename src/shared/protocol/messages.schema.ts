/**
 * WebSocket protocol types — v1.
 * All field names are snake_case matching the wire format from sessions-and-realtime.md.
 * Protocol version must be 1; server rejects other values with 4400.
 */
import type { SessionDetail } from '@/features/lobby';

export const WS_PROTOCOL_VERSION = 1 as const;

// ─── Direction enums ──────────────────────────────────────────────────────────

export enum WsInboundType {
  SYSTEM_WELCOME  = 'system.welcome',
  CONNECTION_PING = 'connection.ping',
  CHAT_MESSAGE    = 'chat.message',
  CHAT_STICKER    = 'chat.sticker',
  SESSION_UPDATED = 'session.updated',
  SYSTEM_ERROR    = 'system.error',
}

export enum WsOutboundType {
  CONNECTION_PONG   = 'connection.pong',
  CHAT_SEND         = 'chat.send',
  CHAT_STICKER_SEND = 'chat.sticker_send',
}

// ─── Common envelope ──────────────────────────────────────────────────────────

export type WsEnvelope<T extends string, P> = {
  v: typeof WS_PROTOCOL_VERSION;
  type: T;
  ts: string;           // ISO 8601
  seq?: number;         // monotonic; present on server-outbound fan-out
  idempotency_key?: string;
  payload: P;
};

// ─── Inbound payloads (server → client) ──────────────────────────────────────

export type WsWelcomePayload = {
  session_id: string;
  your_seq_start: number;
};

export type WsChatMessagePayload = {
  message_id: string;
  from_user_id: string;
  display_name: string;
  text: string;
  ts: string;
};

export type WsChatStickerPayload = {
  message_id: string;
  from_user_id: string;
  display_name: string;
  sticker_url: string;
  ts: string;
};

export type WsSessionUpdatedPayload = {
  // `your_role` is ALWAYS null in this broadcast.
  // Compute client-side: session.members.find(m => m.user_id === viewerId)?.role
  session: SessionDetail;
};

export type WsErrorPayload = {
  code: 'malformed' | 'unsupported_version' | 'unknown_type' | 'unauthorized' | 'not_member' | 'rate_limited' | 'internal';
  message: string;
  ref_seq?: number;
};

// ─── Typed inbound messages ───────────────────────────────────────────────────

export type WsWelcome        = WsEnvelope<WsInboundType.SYSTEM_WELCOME,  WsWelcomePayload>;
export type WsPing           = WsEnvelope<WsInboundType.CONNECTION_PING, Record<string, never>>;
export type WsChatMessage    = WsEnvelope<WsInboundType.CHAT_MESSAGE,    WsChatMessagePayload>;
export type WsChatSticker    = WsEnvelope<WsInboundType.CHAT_STICKER,    WsChatStickerPayload>;
export type WsSessionUpdated = WsEnvelope<WsInboundType.SESSION_UPDATED, WsSessionUpdatedPayload>;
export type WsError          = WsEnvelope<WsInboundType.SYSTEM_ERROR,    WsErrorPayload>;

export type WsInbound =
  | WsWelcome
  | WsPing
  | WsChatMessage
  | WsChatSticker
  | WsSessionUpdated
  | WsError;

// ─── Outbound message builders (client → server) ─────────────────────────────

export type WsOutboundEnvelope<T extends WsOutboundType, P> = {
  v: typeof WS_PROTOCOL_VERSION;
  type: T;
  ts: string;
  idempotency_key?: string;
  payload: P;
};

export function buildPong(): WsOutboundEnvelope<WsOutboundType.CONNECTION_PONG, Record<string, never>> {
  return { v: WS_PROTOCOL_VERSION, type: WsOutboundType.CONNECTION_PONG, ts: new Date().toISOString(), payload: {} };
}

export function buildChatSend(text: string): WsOutboundEnvelope<WsOutboundType.CHAT_SEND, { text: string }> {
  return { v: WS_PROTOCOL_VERSION, type: WsOutboundType.CHAT_SEND, ts: new Date().toISOString(), payload: { text } };
}

export function buildStickerSend(sticker_url: string): WsOutboundEnvelope<WsOutboundType.CHAT_STICKER_SEND, { sticker_url: string }> {
  return { v: WS_PROTOCOL_VERSION, type: WsOutboundType.CHAT_STICKER_SEND, ts: new Date().toISOString(), payload: { sticker_url } };
}
