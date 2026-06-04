import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WsChatEntry } from './socket-store';

/**
 * Client-side chat history, persisted to localStorage and keyed by session id.
 *
 * Chat is intentionally NOT stored on the backend (for now), and the live socket
 * store is wiped on every reconnect — so this is the single durable source for the
 * Chat tab. The game log still owns the Events tab; this store only holds player chat
 * and stickers so they survive page refreshes and reconnects.
 */

const MAX_PER_SESSION = 250;

interface ChatStore {
  bySession: Record<string, WsChatEntry[]>;
  addEntry: (sessionId: string, entry: WsChatEntry) => void;
  clearSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      bySession: {},

      addEntry: (sessionId, entry) => set((state) => {
        const existing = state.bySession[sessionId] ?? [];
        // Dedup by message id — the server echoes the sender's own messages back.
        if (existing.some((e) => e.id === entry.id)) return state;
        const next = [...existing, entry].slice(-MAX_PER_SESSION);
        return { bySession: { ...state.bySession, [sessionId]: next } };
      }),

      clearSession: (sessionId) => set((state) => {
        if (!(sessionId in state.bySession)) return state;
        const bySession = { ...state.bySession };
        delete bySession[sessionId];
        return { bySession };
      }),
    }),
    {
      name: 'tycoon-chat',
      partialize: (s) => ({ bySession: s.bySession }),
    },
  ),
);
