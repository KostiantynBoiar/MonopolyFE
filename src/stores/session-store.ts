import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionDetail } from '@/features/lobby';

interface SessionState {
  currentSession: SessionDetail | null;
  setSession: (session: SessionDetail | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      setSession: (session) => set({ currentSession: session }),
      clearSession: () => set({ currentSession: null }),
    }),
    {
      name: 'tycoon-session',
      partialize: (s) => ({ currentSession: s.currentSession }),
    },
  ),
);
