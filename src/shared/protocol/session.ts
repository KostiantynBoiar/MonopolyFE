import { z } from 'zod';

export enum SessionStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

export enum SessionVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum MemberRole {
  HOST = 'host',
  PLAYER = 'player',
}

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
  ranked: boolean;
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
  ranked: boolean;
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

export const inviteCodeSchema = z
  .string()
  .min(1, 'required')
  .transform((value) => value.toUpperCase().replace(/\s/g, ''))
  .pipe(z.string().regex(/^TYC-[A-Z0-9]{4}$/, 'invite_code_format'));

export const createSessionSchema = z.object({
  visibility: z.nativeEnum(SessionVisibility),
  ranked: z.boolean(),
});

export const joinByCodeSchema = z.object({
  invite_code: inviteCodeSchema,
});

export type CreateSessionFormValues = z.infer<typeof createSessionSchema>;
export type JoinByCodeFormValues = z.infer<typeof joinByCodeSchema>;
