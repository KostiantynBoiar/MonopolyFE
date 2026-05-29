/**
 * Lobby API — real backend client.
 * Talks to the sessions REST API (see MonopolyBE/docs/sessions-and-realtime.md).
 *
 * Base URL:  {apiUrl}/api/v1/sessions
 * Auth:      Authorization: Bearer <token>
 * Wire format is snake_case on both sides (no transforms needed).
 */

import { env } from '@/shared/config/env';
import { LOBBY_PAGE_SIZE } from '@/shared/config/constants';
import type {
  CreateSessionInput,
  JoinByCodeInput,
  LobbyListResponse,
  SessionDetail,
  SessionResponse,
  SessionSummary,
} from './lobby.types';

const BASE = `${env.apiUrl}/api/v1/sessions`;

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/v1/sessions?limit=N[&cursor=...] */
export async function listSessions(
  token: string,
  cursor?: string,
  limit: number = LOBBY_PAGE_SIZE,
): Promise<LobbyListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  // Backend returns { items, next_cursor }; the lobby UI expects { sessions, next_cursor }.
  const data = await request<{ items: SessionSummary[]; next_cursor: string | null }>(
    `?${params.toString()}`,
    token,
  );
  return { sessions: data.items, next_cursor: data.next_cursor };
}

/** GET /api/v1/sessions/{id} — backend returns a bare SessionDetail. */
export async function getSession(token: string, sessionId: string): Promise<SessionResponse> {
  const session = await request<SessionDetail>(`/${sessionId}`, token);
  return { session };
}

/** POST /api/v1/sessions — host is derived from the token. */
export async function createSession(
  token: string,
  input: CreateSessionInput,
  _viewerId: string,
  _viewerName: string,
): Promise<SessionResponse> {
  return request<SessionResponse>('', token, {
    method: 'POST',
    body: JSON.stringify({ visibility: input.visibility }),
  });
}

/** POST /api/v1/sessions/{id}/join — joining user is derived from the token. */
export async function joinSession(
  token: string,
  sessionId: string,
  _viewerId: string,
  _viewerName: string,
): Promise<SessionResponse> {
  return request<SessionResponse>(`/${sessionId}/join`, token, { method: 'POST' });
}

/** POST /api/v1/sessions/join-by-code */
export async function joinByCode(
  token: string,
  input: JoinByCodeInput,
  _viewerId: string,
  _viewerName: string,
): Promise<SessionResponse> {
  return request<SessionResponse>('/join-by-code', token, {
    method: 'POST',
    body: JSON.stringify({ invite_code: input.invite_code }),
  });
}

/** GET /api/v1/sessions/by-code/{invite_code} — bare SessionDetail; 409 if already started. */
export async function getSessionByCode(
  token: string,
  inviteCode: string,
): Promise<SessionResponse> {
  const session = await request<SessionDetail>(
    `/by-code/${encodeURIComponent(inviteCode)}`,
    token,
  );
  return { session };
}

/** POST /api/v1/sessions/{id}/leave — returns 204. */
export async function leaveSession(token: string, sessionId: string): Promise<void> {
  await request<void>(`/${sessionId}/leave`, token, { method: 'POST' });
}

/** DELETE /api/v1/sessions/{id}/members/{userId} — host kick. Returns the updated
 *  session, but callers rely on the session.updated WS broadcast, so we discard it. */
export async function kickMember(
  token: string,
  sessionId: string,
  userId: string,
): Promise<void> {
  await request<SessionDetail>(`/${sessionId}/members/${userId}`, token, { method: 'DELETE' });
}

/** POST /api/v1/sessions/{id}/start — returns { session, status }; the in-progress
 *  transition also arrives via the session.updated/game.state WS broadcasts. */
export async function startGame(token: string, sessionId: string): Promise<void> {
  await request<{ session: SessionDetail; status: string }>(`/${sessionId}/start`, token, {
    method: 'POST',
  });
}
