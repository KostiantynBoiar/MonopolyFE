/**
 * Lobby API — mock implementation.
 * Function signatures match the real backend contract (sessions-and-realtime.md).
 * Replace the bodies with real fetch() calls once the backend is wired up.
 *
 * Base URL:  /api/v1
 * Auth:      Authorization: Bearer <token>
 */

import { MemberRole, SessionStatus, SessionVisibility } from './lobby.enums';
import { LOBBY_PAGE_SIZE } from '@/shared/config/constants';
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
  {
    id: 'sess_005',
    invite_code: 'TYC-N2P7',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 4,
    max_players: 8,
    host: { id: 'u_max', display_name: 'Max' },
    created_at: minutesAgo(52),
    members: [
      { user_id: 'u_max',  display_name: 'Max',  role: MemberRole.HOST,   joined_at: minutesAgo(52) },
      { user_id: 'u_nina', display_name: 'Nina', role: MemberRole.PLAYER, joined_at: minutesAgo(48) },
      { user_id: 'u_omar', display_name: 'Omar', role: MemberRole.PLAYER, joined_at: minutesAgo(45) },
      { user_id: 'u_pia',  display_name: 'Pia',  role: MemberRole.PLAYER, joined_at: minutesAgo(40) },
    ],
    your_role: null,
  },
  {
    id: 'sess_006',
    invite_code: 'TYC-H5V3',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 1,
    max_players: 8,
    host: { id: 'u_quinn', display_name: 'Quinn' },
    created_at: minutesAgo(61),
    members: [
      { user_id: 'u_quinn', display_name: 'Quinn', role: MemberRole.HOST, joined_at: minutesAgo(61) },
    ],
    your_role: null,
  },
  {
    id: 'sess_007',
    invite_code: 'TYC-W8X1',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 5,
    max_players: 8,
    host: { id: 'u_rosa', display_name: 'Rosa' },
    created_at: minutesAgo(78),
    members: [
      { user_id: 'u_rosa',  display_name: 'Rosa',  role: MemberRole.HOST,   joined_at: minutesAgo(78) },
      { user_id: 'u_sam',   display_name: 'Sam',   role: MemberRole.PLAYER, joined_at: minutesAgo(74) },
      { user_id: 'u_tina',  display_name: 'Tina',  role: MemberRole.PLAYER, joined_at: minutesAgo(70) },
      { user_id: 'u_ulric', display_name: 'Ulric', role: MemberRole.PLAYER, joined_at: minutesAgo(65) },
      { user_id: 'u_vera',  display_name: 'Vera',  role: MemberRole.PLAYER, joined_at: minutesAgo(60) },
    ],
    your_role: null,
  },
  {
    id: 'sess_008',
    invite_code: 'TYC-D4F9',
    status: SessionStatus.WAITING,
    visibility: SessionVisibility.PUBLIC,
    member_count: 3,
    max_players: 8,
    host: { id: 'u_will', display_name: 'Will' },
    created_at: minutesAgo(90),
    members: [
      { user_id: 'u_will', display_name: 'Will', role: MemberRole.HOST,   joined_at: minutesAgo(90) },
      { user_id: 'u_xena', display_name: 'Xena', role: MemberRole.PLAYER, joined_at: minutesAgo(85) },
      { user_id: 'u_yuki', display_name: 'Yuki', role: MemberRole.PLAYER, joined_at: minutesAgo(80) },
    ],
    your_role: null,
  },
];

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/v1/sessions?limit=N[&cursor=...] */
export async function listSessions(
  _token: string,
  cursor?: string,
  limit: number = LOBBY_PAGE_SIZE,
): Promise<LobbyListResponse> {
  await delay(450);

  const summaries = MOCK_POOL.map(({ members: _m, your_role: _r, ...s }) => s);

  // Decode cursor: opaque string encoded as "<created_at>|<session_id>"
  let startIdx = 0;
  if (cursor) {
    const sessionId = cursor.split('|')[1];
    const idx = summaries.findIndex((s) => s.id === sessionId);
    if (idx !== -1) startIdx = idx + 1;
  }

  const page = summaries.slice(startIdx, startIdx + limit);
  const last = page.at(-1);
  const hasMore = startIdx + limit < summaries.length;
  const next_cursor = hasMore && last ? `${last.created_at}|${last.id}` : null;

  return { sessions: page, next_cursor };
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
