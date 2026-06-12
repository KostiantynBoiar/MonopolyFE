'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Guards a client page behind authentication.
 *
 * Returns `{ ready, token, user }`.
 * - `ready = false` while Zustand is rehydrating from localStorage (first render).
 *   Show a spinner during this window to prevent the white-flash redirect.
 * - Once hydrated: if no token, silently replaces to /login.
 * - Once hydrated and authenticated: `ready = true`, safe to render the page.
 */
export function useRequireAuth() {
  const { token, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Mark client-side hydration complete after first paint
  useEffect(() => {
    const id = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (hydrated && !token) {
      const from = encodeURIComponent(pathname);
      router.replace(`/login?from=${from}`);
    }
  }, [hydrated, token, router, pathname]);

  return {
    ready:  hydrated && !!token,
    token:  token  ?? null,
    user:   user   ?? null,
  };
}
