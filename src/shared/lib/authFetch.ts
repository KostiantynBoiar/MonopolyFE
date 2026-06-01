import { env } from '@/shared/config/env';

/**
 * Authed fetch with transparent access-token refresh.
 *
 * Adds `Authorization: Bearer <accessToken>` from the auth store. On a 401 it calls the
 * store's `refresh()` once and retries; if refresh fails the store logs the user out.
 * Use this for authed REST calls (lobby/game) so an expired access token doesn't bounce
 * the user. Returns parsed JSON, or throws `Error(detail)` on a non-OK response.
 *
 * Decoupled from the store via dynamic import to avoid an import cycle
 * (auth-store → features/auth/api; this helper → auth-store).
 */
export async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { useAuthStore } = await import('@/stores/auth-store');

  const withAuth = (token: string | null): RequestInit => ({
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const url = `${env.apiUrl}${path}`;
  let res = await fetch(url, withAuth(useAuthStore.getState().token));

  if (res.status === 401) {
    const refreshed = await useAuthStore.getState().refresh();
    if (refreshed) {
      res = await fetch(url, withAuth(useAuthStore.getState().token));
    } else {
      useAuthStore.getState().logout();
      throw new Error('Your session has expired. Please sign in again.');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
