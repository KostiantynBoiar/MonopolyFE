import { SocketStatus } from '@/shared/socket';
import { ChatMessage } from '../chat/chat.types';
import type { MemberRole, SessionStatus, SessionVisibility } from './lobby.enums';

// ─── Wire types (snake_case matches backend REST/WS contract) ─────────────────

export interface LobbyHost {
  id: string;
  display_name: string;
}

export interface SessionMember {
  user_id: string;
  display_name: string;
  role: MemberRole;
  joined_at: string;
}

export interface SessionSummary {
  id: string;
  invite_code: string;       // e.g. "TYC-A1B2"
  status: SessionStatus;
  visibility: SessionVisibility;
  member_count: number;
  max_players: number;       // always 8
  host: LobbyHost;
  created_at: string;        // ISO 8601
}

export interface SessionDetail extends SessionSummary {
  members: SessionMember[];
  your_role: MemberRole | null;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateSessionInput {
  visibility: SessionVisibility;
}

export interface JoinByCodeInput {
  invite_code: string;
}

// ─── Response envelopes ───────────────────────────────────────────────────────

export interface LobbyListResponse {
  sessions: SessionSummary[];
  next_cursor: string | null;
}

export interface SessionResponse {
  session: SessionDetail;
}

export interface WaitingCenterPanelProps {
  session: SessionDetail;
  messages: ChatMessage[];
  onSendMessage?: (text: string) => void;
  onLeave: () => void;
  onStart: () => void;
  isLeaving?: boolean;
  isStarting?: boolean;
  socketStatus?: SocketStatus;
}