import { SocketStatus } from '@/shared/socket';
import { ChatMessage } from '../chat/chat.types';
import type { MemberRole, SessionStatus, SessionVisibility } from './lobby.enums';

// ─── Wire types (snake_case matches backend REST/WS contract) ─────────────────

export type LobbyHost = {
  id: string;
  display_name: string;
};

export type SessionMember = {
  user_id: string;
  display_name: string;
  role: MemberRole;
  joined_at: string;
};

export type SessionSummary = {
  id: string;
  invite_code: string;       // e.g. "TYC-A1B2"
  status: SessionStatus;
  visibility: SessionVisibility;
  member_count: number;
  max_players: number;       // always 8
  host: LobbyHost;
  created_at: string;        // ISO 8601
};

export type SessionDetail = SessionSummary & {
  members: SessionMember[];
  your_role: MemberRole | null;
};

// ─── Request payloads ─────────────────────────────────────────────────────────

export type CreateSessionInput = {
  visibility: SessionVisibility;
};

export type JoinByCodeInput = {
  invite_code: string;
};

// ─── Response envelopes ───────────────────────────────────────────────────────

export type LobbyListResponse = {
  sessions: SessionSummary[];
  next_cursor: string | null;
};

export type SessionResponse = {
  session: SessionDetail;
};

export type WaitingCenterPanelProps = {
  session: SessionDetail;
  messages: ChatMessage[];
  onSendMessage?: (text: string) => void;
  onLeave: () => void;
  onStart: () => void;
  isLeaving?: boolean;
  isStarting?: boolean;
  socketStatus?: SocketStatus;
};