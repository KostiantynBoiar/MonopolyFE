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

export async function getSession(sessionId: string): Promise<SessionResponse> {
  const session = await authFetch<SessionDetail>(`${BASE}/${sessionId}`);
  return { session };
}

export async function createSession(input: CreateSessionInput): Promise<SessionResponse> {
  return authFetch<SessionResponse>(BASE, {
    method: 'POST',
    body: JSON.stringify({ visibility: input.visibility, ranked: input.ranked }),
  });
}

export async function joinSession(sessionId: string): Promise<SessionResponse> {
  return authFetch<SessionResponse>(`${BASE}/${sessionId}/join`, { method: 'POST' });
}

export async function joinByCode(input: JoinByCodeInput): Promise<SessionResponse> {
  return authFetch<SessionResponse>(`${BASE}/join-by-code`, {
    method: 'POST',
    body: JSON.stringify({ invite_code: input.invite_code }),
  });
}

export async function getSessionByCode(inviteCode: string): Promise<SessionResponse> {
  const session = await authFetch<SessionDetail>(
    `${BASE}/by-code/${encodeURIComponent(inviteCode)}`,
  );
  return { session };
}

export async function leaveSession(sessionId: string): Promise<void> {
  await authFetch<void>(`${BASE}/${sessionId}/leave`, { method: 'POST' });
}

export async function kickMember(sessionId: string, userId: string): Promise<void> {
  await authFetch<SessionDetail>(`${BASE}/${sessionId}/members/${userId}`, { method: 'DELETE' });
}

export async function startGame(sessionId: string): Promise<void> {
  await authFetch<{ session: SessionDetail; status: string }>(`${BASE}/${sessionId}/start`, {
    method: 'POST',
  });
}
