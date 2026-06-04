import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('invalid_email'),
  password: z.string().min(1, 'required').max(128, 'max_128'),
});

export const registerSchema = z.object({
  email: z.string().email('invalid_email'),
  password: z.string().min(8, 'password_min_8').max(128, 'max_128'),
  display_name: z.string().min(2, 'display_name_min_2').max(32, 'display_name_max_32'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface UserPublic {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  rating: number;
  games_played: number;
  calibration_complete: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface AuthResponse {
  user: UserPublic;
  token: TokenResponse;
}

export interface MeResponse {
  user: UserPublic;
}
