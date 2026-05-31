import { create } from 'zustand';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { GameState } from '@/shared/protocol/game-state';
import { emptySnapshot } from '@/shared/transport/state-adapter';

interface GameStore {
  snapshot: GameSnapshot;

  setSnapshot:        (snapshot: GameSnapshot) => void;
  updateGame:         (updater: (prev: GameState) => GameState) => void;
  reset:              () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Safe placeholder until the first server `game.state` frame arrives.
  snapshot: emptySnapshot(),

  setSnapshot: (snapshot) => set({ snapshot }),

  /** Merge a partial GameState into the current snapshot without touching permissions. */
  updateGame: (updater) =>
    set((s) => ({
      snapshot: { ...s.snapshot, game: updater(s.snapshot.game) },
    })),

  reset: () => set({ snapshot: emptySnapshot() }),
}));
