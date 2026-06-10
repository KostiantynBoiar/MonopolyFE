import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionDetail } from '@/shared/protocol/session';
import { PERSIST_VERSION, migratePersistedState } from '@/shared/lib/persist';

interface SessionState {
  currentSession: SessionDetail | null;
  /** True when the viewer went bankrupt in the current session (game still in progress). */
  viewerBankruptInSession: boolean;
  _hasHydrated: boolean;
  setSession: (session: SessionDetail | null) => void;
  clearSession: () => void;
  setViewerBankruptInSession: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      viewerBankruptInSession: false,
      _hasHydrated: false,
      setSession: (session) => set({ currentSession: session }),
      clearSession: () => set({ currentSession: null, viewerBankruptInSession: false }),
      setViewerBankruptInSession: () => set({ viewerBankruptInSession: true }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'tycoon-session',
      version: PERSIST_VERSION,
      migrate: migratePersistedState,
      partialize: (s) => ({ currentSession: s.currentSession, viewerBankruptInSession: s.viewerBankruptInSession }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          return;
        }
        // Storage error path: mark hydration done but do NOT clear currentSession —
        // the validation effect in the game room page will detect the missing session
        // and redirect to lobby cleanly.
        useSessionStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
