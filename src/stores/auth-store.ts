import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister, getMe } from '@/features/auth/api';
import type { UserPublic } from '@/features/auth/auth.schema';

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiLogin({ email, password });
          set({ user, token: token.access_token, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      register: async (email, password, display_name) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await apiRegister({ email, password, display_name });
          set({ user, token: token.access_token, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      logout: () => set({ user: null, token: null, error: null }),

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const { user } = await getMe(token);
          set({ user, isLoading: false });
        } catch {
          set({ user: null, token: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tycoon-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
