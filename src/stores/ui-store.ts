import { create } from 'zustand';
import type { DeedInfo } from '@/features/deed';

// ── WalkState lives here so the game-dispatch hook and board consumers share
//    one definition without a cross-feature import.
export interface WalkState { playerId: string; currentPos: number; fast?: boolean }

// ── Modals the UI can open
export type ModalKind = 'trade' | 'manage' | null;

interface UiStore {
  // Animations
  isRolling: boolean;
  walkState: WalkState | null;

  // Overlays / modals
  activeDeed:  DeedInfo | null;
  openedModal: ModalKind;

  // Board interaction
  hoveredTile:  number | null;
  selectedTile: number | null;

  // Actions
  setIsRolling:  (v: boolean) => void;
  setWalkState:  (v: WalkState | null) => void;
  setActiveDeed: (v: DeedInfo | null) => void;
  setOpenedModal:(v: ModalKind) => void;
  setHoveredTile:(v: number | null) => void;
  setSelectedTile:(v: number | null) => void;
  reset:         () => void;
}

const INITIAL: Pick<UiStore,
  'isRolling' | 'walkState' | 'activeDeed' | 'openedModal' | 'hoveredTile' | 'selectedTile'
> = {
  isRolling:    false,
  walkState:    null,
  activeDeed:   null,
  openedModal:  null,
  hoveredTile:  null,
  selectedTile: null,
};

export const useUiStore = create<UiStore>((set) => ({
  ...INITIAL,

  setIsRolling:   (v) => set({ isRolling: v }),
  setWalkState:   (v) => set({ walkState: v }),
  setActiveDeed:  (v) => set({ activeDeed: v }),
  setOpenedModal: (v) => set({ openedModal: v }),
  setHoveredTile: (v) => set({ hoveredTile: v }),
  setSelectedTile:(v) => set({ selectedTile: v }),
  reset:          ()  => set({ ...INITIAL }),
}));
