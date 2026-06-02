import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { GameState } from '@/shared/protocol/game-state';
import { emptySnapshot } from '@/shared/transport/state-adapter';

interface GameStore {
  snapshot: GameSnapshot;

  setSnapshot:        (snapshot: GameSnapshot) => void;
  updateGame:         (updater: (prev: GameState) => GameState) => void;
  reset:              () => void;
}

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
      partialize: (s) => ({ snapshot: { game: { log: s.snapshot.game.log } } }),
      merge: (persisted, current) => {
        const p = persisted as Partial<GameStore>;
        if (!p.snapshot?.game?.log?.length) return current;
        return {
          ...current,
          snapshot: {
            ...current.snapshot,
            game: {
              ...current.snapshot.game,
              log: p.snapshot.game.log,
            },
          },
        };
      },
    },
  ),
);
