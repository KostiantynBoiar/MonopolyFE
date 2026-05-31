/**
 * Lobby API — real backend client.
 * Talks to the sessions REST API (see MonopolyBE/docs/sessions-and-realtime.md).
 *
 * Auth is handled transparently by authFetch (reads token from the auth store,
 * retries once on 401 after a token refresh).
 */

import { authFetch } from '@/shared/lib/authFetch';
import { LOBBY_PAGE_SIZE } from '@/shared/config/constants';
import type {
  CreateSessionInput,
  JoinByCodeInput,
  LobbyListResponse,
  SessionDetail,
  SessionResponse,
  SessionSummary,
} from './lobby.types';

const BASE = '/api/v1/sessions';

/** GET /api/v1/sessions?limit=N[&cursor=...] */
export async function listSessions(
  cursor?: string,
  limit: number = LOBBY_PAGE_SIZE,
): Promise<LobbyListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const data = await authFetch<{ items: SessionSummary[]; next_cursor: string | null }>(
    `${BASE}?${params.toString()}`,
  );
  return { sessions: data.items, next_cursor: data.next_cursor };
}

/** GET /api/v1/sessions/{id} — backend returns a bare SessionDetail. */
export async function getSession(sessionId: string): Promise<SessionResponse> {
  const session = await authFetch<SessionDetail>(`${BASE}/${sessionId}`);
  return { session };
}

/** POST /api/v1/sessions */
export async function createSession(input: CreateSessionInput): Promise<SessionResponse> {
  return authFetch<SessionResponse>(BASE, {
    method: 'POST',
    body: JSON.stringify({ visibility: input.visibility }),
  });
}

/** POST /api/v1/sessions/{id}/join */
export async function joinSession(sessionId: string): Promise<SessionResponse> {
  return authFetch<SessionResponse>(`${BASE}/${sessionId}/join`, { method: 'POST' });
}

/** POST /api/v1/sessions/join-by-code */
export async function joinByCode(input: JoinByCodeInput): Promise<SessionResponse> {
  return authFetch<SessionResponse>(`${BASE}/join-by-code`, {
    method: 'POST',
    body: JSON.stringify({ invite_code: input.invite_code }),
  });
}

/** GET /api/v1/sessions/by-code/{invite_code} — bare SessionDetail; 409 if already started. */
export async function getSessionByCode(inviteCode: string): Promise<SessionResponse> {
  const session = await authFetch<SessionDetail>(
    `${BASE}/by-code/${encodeURIComponent(inviteCode)}`,
  );
  return { session };
}

/** POST /api/v1/sessions/{id}/leave — returns 204. */
export async function leaveSession(sessionId: string): Promise<void> {
  await authFetch<void>(`${BASE}/${sessionId}/leave`, { method: 'POST' });
}

/** DELETE /api/v1/sessions/{id}/members/{userId} — host kick. */
export async function kickMember(sessionId: string, userId: string): Promise<void> {
  await authFetch<SessionDetail>(`${BASE}/${sessionId}/members/${userId}`, { method: 'DELETE' });
}

/** POST /api/v1/sessions/{id}/start */
export async function startGame(sessionId: string): Promise<void> {
  await authFetch<{ session: SessionDetail; status: string }>(`${BASE}/${sessionId}/start`, {
    method: 'POST',
  });
}
