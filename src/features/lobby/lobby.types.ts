import type { MemberRole, SessionStatus, SessionVisibility } from './lobby.enums';

export interface LobbyHost {
  id: string;
  display_name: string;
  rating: number;
  calibration_complete: boolean;
}

export interface SessionMember {
  user_id: string;
  display_name: string;
  role: MemberRole;
  joined_at: string;
  rating: number;
  calibration_complete: boolean;
}

export interface SessionSummary {
  id: string;
  invite_code: string;
  status: SessionStatus;
  visibility: SessionVisibility;
  member_count: number;
  max_players: number;
  host: LobbyHost;
  created_at: string;
}

export interface SessionDetail extends SessionSummary {
  members: SessionMember[];
  your_role: MemberRole | null;
}

export interface CreateSessionInput {
  visibility: SessionVisibility;
}

export interface JoinByCodeInput {
  invite_code: string;
}

export interface LobbyListResponse {
  sessions: SessionSummary[];
  next_cursor: string | null;
}

export interface SessionResponse {
  session: SessionDetail;
}
