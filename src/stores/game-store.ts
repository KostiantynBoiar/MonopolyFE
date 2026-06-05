import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { GameState } from '@/shared/protocol/game-state';
import { GameStatus } from '@/shared/protocol/game-state.enums';
import { emptySnapshot } from '@/shared/transport/state-adapter';
import { PERSIST_VERSION, migratePersistedState } from '@/shared/lib/persist';

interface GameStore {
  snapshot: GameSnapshot;

  setSnapshot:        (snapshot: GameSnapshot) => void;
  updateGame:         (updater: (prev: GameState) => GameState) => void;
  reset:              () => void;
}

// Only the fields we actually persist.
type PersistedSlice = {
  snapshot?: {
    game?: {
      gameId?: string;
      log?: GameState['log'];
    };
  };
};

function shouldPersistSnapshot(snapshot: GameSnapshot): boolean {
  return snapshot.game.status !== GameStatus.FINISHED;
}

// Debounce localStorage writes so rapid setSnapshot calls during gameplay
// don't serialize on every frame — only flush after 2 s of inactivity.
const debouncedStorage = (() => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    getItem:    (key: string) => localStorage.getItem(key),
    removeItem: (key: string) => {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      localStorage.removeItem(key);
    },
    setItem: (key: string, value: string) => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.setItem(key, value);
        timer = null;
      }, 2_000);
    },
  };
})();

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      snapshot: emptySnapshot(),

      setSnapshot: (snapshot) => set({ snapshot }),

      updateGame: (updater) =>
        set((s) => ({
          snapshot: { ...s.snapshot, game: updater(s.snapshot.game) },
        })),

      reset: () => set({ snapshot: emptySnapshot() }),
    }),
    {
      name: 'tycoon-game',
      version: PERSIST_VERSION,
      migrate: migratePersistedState,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (s) => (
        shouldPersistSnapshot(s.snapshot)
          ? {
              snapshot: {
                game: {
                  gameId: s.snapshot.game.gameId,
                  log:    s.snapshot.game.log,
                },
              },
            }
          : {}
      ),
      merge: (persisted, current) => {
        // `persisted` is undefined when migrate discards a stale-version slice.
        const p = (persisted ?? {}) as PersistedSlice;
        if (!shouldPersistSnapshot(current.snapshot)) {
          return current;
        }
        const log    = p.snapshot?.game?.log;
        const gameId = p.snapshot?.game?.gameId;
        const currentGameId = current.snapshot.game.gameId;
        // During hydration the live snapshot is still empty, so allow the persisted
        // log through; the first authoritative server frame will replace it.
        if (!log?.length || !gameId) return current;
        if (currentGameId && gameId !== currentGameId) return current;
        return {
          ...current,
          snapshot: {
            ...current.snapshot,
            game: { ...current.snapshot.game, gameId: currentGameId || gameId, log },
          },
        };
      },
    },
  ),
);
