/**
 * Lobby API — mock implementation.
 * Function signatures match the real backend contract (sessions-and-realtime.md).
 * Replace the bodies with real fetch() calls once the backend is wired up.
 *
 * Base URL:  /api/v1
 * Auth:      Authorization: Bearer <token>
 */

import { MemberRole, SessionStatus, SessionVisibility } from './lobby.enums';
import type {
  CreateSessionInput,
  JoinByCodeInput,
  LobbyListResponse,
  SessionDetail,
  SessionResponse,
} from './lobby.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'TYC-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_POOL: SessionDetail[] = [
  {
    id: 'sess_001',
    invite_code: 'TYC-A7X2',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 3,
    max_players: 8,
    host: { id: 'u_alice', display_name: 'Alice' },
    created_at: minutesAgo(8),
    members: [
      { user_id: 'u_alice', display_name: 'Alice', role: MemberRole.HOST,   joined_at: minutesAgo(8) },
      { user_id: 'u_bob',   display_name: 'Bob',   role: MemberRole.PLAYER, joined_at: minutesAgo(6) },
      { user_id: 'u_carol', display_name: 'Carol', role: MemberRole.PLAYER, joined_at: minutesAgo(3) },
    ],
    your_role: null,
  },
  {
    id: 'sess_002',
    invite_code: 'TYC-B3K9',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 1,
    max_players: 8,
    host: { id: 'u_dave', display_name: 'Dave' },
    created_at: minutesAgo(2),
    members: [
      { user_id: 'u_dave', display_name: 'Dave', role: MemberRole.HOST, joined_at: minutesAgo(2) },
    ],
    your_role: null,
  },
  {
    id: 'sess_003',
    invite_code: 'TYC-R4M1',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 6,
    max_players: 8,
    host: { id: 'u_eve', display_name: 'Eve' },
    created_at: minutesAgo(25),
    members: [
      { user_id: 'u_eve',   display_name: 'Eve',   role: MemberRole.HOST,   joined_at: minutesAgo(25) },
      { user_id: 'u_frank', display_name: 'Frank', role: MemberRole.PLAYER, joined_at: minutesAgo(22) },
      { user_id: 'u_grace', display_name: 'Grace', role: MemberRole.PLAYER, joined_at: minutesAgo(20) },
      { user_id: 'u_han',   display_name: 'Han',   role: MemberRole.PLAYER, joined_at: minutesAgo(15) },
      { user_id: 'u_iris',  display_name: 'Iris',  role: MemberRole.PLAYER, joined_at: minutesAgo(10) },
      { user_id: 'u_jay',   display_name: 'Jay',   role: MemberRole.PLAYER, joined_at: minutesAgo(5) },
    ],
    your_role: null,
  },
  {
    id: 'sess_004',
    invite_code: 'TYC-Q9Z3',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 2,
    max_players: 8,
    host: { id: 'u_kate', display_name: 'Kate' },
    created_at: minutesAgo(45),
    members: [
      { user_id: 'u_kate', display_name: 'Kate', role: MemberRole.HOST,   joined_at: minutesAgo(45) },
      { user_id: 'u_leo',  display_name: 'Leo',  role: MemberRole.PLAYER, joined_at: minutesAgo(30) },
    ],
    your_role: null,
  },
];

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/v1/sessions */
export async function listSessions(
  _token: string,
  _cursor?: string,
): Promise<LobbyListResponse> {
  await delay(450);
  return {
    sessions: MOCK_POOL.map(({ members: _m, your_role: _r, ...s }) => s),
    next_cursor: null,
  };
}

/** GET /api/v1/sessions/{id} */
export async function getSession(
  _token: string,
  sessionId: string,
): Promise<SessionResponse> {
  await delay(300);
  const session = MOCK_POOL.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  return { session: { ...session } };
}

/** POST /api/v1/sessions */
export async function createSession(
  _token: string,
  input: CreateSessionInput,
  viewerId: string,
  viewerName: string,
): Promise<SessionResponse> {
  await delay(600);
  const id = `sess_${Date.now()}`;
  const session: SessionDetail = {
    id,
    invite_code: randomCode(),
    status: SessionStatus.WAITING,
    visibility: input.visibility,
    member_count: 1,
    max_players: 8,
    host: { id: viewerId, display_name: viewerName },
    created_at: new Date().toISOString(),
    members: [
      {
        user_id: viewerId,
        display_name: viewerName,
        role: MemberRole.HOST,
        joined_at: new Date().toISOString(),
      },
    ],
    your_role: MemberRole.HOST,
  };
  MOCK_POOL.push(session);
  return { session };
}

/** POST /api/v1/sessions/{id}/join */
export async function joinSession(
  _token: string,
  sessionId: string,
  viewerId: string,
  viewerName: string,
): Promise<SessionResponse> {
  await delay(500);
  const session = MOCK_POOL.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  if (session.member_count >= session.max_players) throw new Error('Session is full');
  if (session.members.some((m) => m.user_id === viewerId)) {
    return { session: { ...session, your_role: MemberRole.PLAYER } };
  }

  session.members.push({
    user_id: viewerId,
    display_name: viewerName,
    role: MemberRole.PLAYER,
    joined_at: new Date().toISOString(),
  });
  session.member_count += 1;
  return { session: { ...session, your_role: MemberRole.PLAYER } };
}

/** POST /api/v1/sessions/join-by-code */
export async function joinByCode(
  _token: string,
  input: JoinByCodeInput,
  viewerId: string,
  viewerName: string,
): Promise<SessionResponse> {
  await delay(550);
  const session = MOCK_POOL.find((s) => s.invite_code === input.invite_code);
  if (!session) throw new Error('No session found for that code');
  return joinSession(_token, session.id, viewerId, viewerName);
}

/** GET /api/v1/sessions/by-code/{invite_code} */
export async function getSessionByCode(
  _token: string,
  inviteCode: string,
): Promise<SessionResponse> {
  await delay(300);
  const session = MOCK_POOL.find((s) => s.invite_code === inviteCode);
  if (!session) throw new Error('No session found for that code');
  if (session.status !== SessionStatus.WAITING) throw new Error('That game has already started');
  return { session: { ...session } };
}

/** POST /api/v1/sessions/{id}/leave — returns 204 */
export async function leaveSession(_token: string, _sessionId: string): Promise<void> {
  await delay(300);
}

/** DELETE /api/v1/sessions/{id}/members/{userId} — host kick */
export async function kickMember(
  _token: string,
  sessionId: string,
  userId: string,
): Promise<void> {
  await delay(300);
  const session = MOCK_POOL.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  session.members = session.members.filter((m) => m.user_id !== userId);
  session.member_count = session.members.length;
}

/** POST /api/v1/sessions/{id}/start */
export async function startGame(_token: string, _sessionId: string): Promise<void> {
  await delay(400);
}
