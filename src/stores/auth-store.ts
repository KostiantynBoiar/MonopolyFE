import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as apiLogin,
  register as apiRegister,
  refresh as apiRefresh,
  logout as apiLogout,
  getMe,
} from '@/features/auth/api';
import type { UserPublic } from '@/features/auth/auth.schema';
import { PERSIST_VERSION, migratePersistedState } from '@/shared/lib/persist';

interface AuthState {
  user: UserPublic | null;
  token: string | null;          // access token (short-lived)
  refreshToken: string | null;   // long-lived; rotated on each refresh
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name: string) => Promise<void>;
  logout: () => void;
  /** Exchange the refresh token for a fresh pair. Returns true on success. */
  refresh: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiLogin({ email, password });
          set({
            user,
            token: token.access_token,
            refreshToken: token.refresh_token,
            isLoading: false,
          });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      register: async (email, password, display_name) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiRegister({ email, password, display_name });
          set({
            user,
            token: token.access_token,
            refreshToken: token.refresh_token,
            isLoading: false,
          });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        const { refreshToken } = get();
        if (refreshToken) void apiLogout(refreshToken); // revoke server-side, fire-and-forget
        set({ user: null, token: null, refreshToken: null, error: null });
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const { user, token } = await apiRefresh(refreshToken);
          set({ user, token: token.access_token, refreshToken: token.refresh_token });
          return true;
        } catch {
          // Refresh token is invalid/expired/revoked → fully log out.
          set({ user: null, token: null, refreshToken: null });
          return false;
        }
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const { user } = await getMe(token);
          set({ user, isLoading: false });
        } catch {
          // Access token likely expired — try a refresh before giving up so the
          // user isn't logged out on app load.
          const ok = await get().refresh();
          if (ok) {
            try {
              const { user } = await getMe(get().token!);
              set({ user, isLoading: false });
              return;
            } catch {
              /* fall through to clear */
            }
          }
          set({ user: null, token: null, refreshToken: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tycoon-auth',
      version: PERSIST_VERSION,
      migrate: migratePersistedState,
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, user: s.user }),
    },
  ),
);
