import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionDetail } from '@/features/lobby';

interface SessionState {
  currentSession: SessionDetail | null;
  _hasHydrated: boolean;
  setSession: (session: SessionDetail | null) => void;
  clearSession: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      _hasHydrated: false,
      setSession: (session) => set({ currentSession: session }),
      clearSession: () => set({ currentSession: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'tycoon-session',
      partialize: (s) => ({ currentSession: s.currentSession }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.setHasHydrated(true);
          return;
        }

        if (error) {
          useSessionStore.setState({ currentSession: null, _hasHydrated: true });
        }
      },
    },
  ),
);
