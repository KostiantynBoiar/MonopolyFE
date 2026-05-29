import { env } from '@/shared/config/env';
import type { AuthResponse, LoginInput, MeResponse, RegisterInput } from './auth.schema';

const BASE = `${env.apiUrl}/api/v1/auth`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function register(data: RegisterInput): Promise<AuthResponse> {
  return request('/register', { method: 'POST', body: JSON.stringify(data) });
}

export function login(data: LoginInput): Promise<AuthResponse> {
  return request('/login', { method: 'POST', body: JSON.stringify(data) });
}

export function getMe(token: string): Promise<MeResponse> {
  return request('/me', { headers: { Authorization: `Bearer ${token}` } });
}
