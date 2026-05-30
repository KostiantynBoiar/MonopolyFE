import { create } from 'zustand';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import type { GameState } from '@/shared/protocol/game-state';
import type { ServerMessage } from '@/shared/protocol/network';
import { applyMessage } from '@/shared/protocol/network';
import { MOCK_SNAPSHOT } from '@/shared/mocks/game-state.mock';

interface GameStore {
  snapshot: GameSnapshot;

  setSnapshot:        (snapshot: GameSnapshot) => void;
  applyServerMessage: (msg: ServerMessage) => void;
  updateGame:         (updater: (prev: GameState) => GameState) => void;
  reset:              () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  snapshot: MOCK_SNAPSHOT,

  setSnapshot: (snapshot) => set({ snapshot }),

  applyServerMessage: (msg) =>
    set((s) => ({ snapshot: applyMessage(s.snapshot, msg) })),

  /** Merge a partial GameState into the current snapshot without touching permissions. */
  updateGame: (updater) =>
    set((s) => ({
      snapshot: { ...s.snapshot, game: updater(s.snapshot.game) },
    })),

  reset: () => set({ snapshot: MOCK_SNAPSHOT }),
}));
