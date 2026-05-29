import { create } from 'zustand';
import type { SessionDetail } from '@/features/lobby';

interface SessionState {
  currentSession: SessionDetail | null;
  setSession: (session: SessionDetail | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  setSession: (session) => set({ currentSession: session }),
  clearSession: () => set({ currentSession: null }),
}));
