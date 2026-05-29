import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Required').max(128),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'At least 8 characters').max(128, 'Max 128 characters'),
  display_name: z.string().min(2, 'At least 2 characters').max(32, 'Max 32 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface UserPublic {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface AuthResponse {
  user: UserPublic;
  token: TokenResponse;
}

export interface MeResponse {
  user: UserPublic;
}
