import { create } from 'zustand';
import type { DeedInfo } from '@/features/deed/deed.types';
import type { WalkingAnimationVariant } from '@/shared/protocol/animation';
import type { ActiveCard, DiceRoll } from '@/shared/protocol/game-state';

// ── WalkState lives here so the game-dispatch hook and board consumers share
//    one definition without a cross-feature import.
export interface WalkState { playerId: string; currentPos: number; variant?: WalkingAnimationVariant }
export interface PendingAnimationInteraction {
  interactionId: string;
  affectedPlayerId: string;
}

// ── Modals the UI can open
export type ModalKind = 'trade' | 'manage' | null;

interface UiStore {
  // Animations
  isRolling:    boolean;
  walkState:    WalkState | null;
  isTimelineRunning: boolean;
  // Dice shown during the roll_dice animation (overrides game.turn.diceRoll until committed).
  animatedDiceRoll:   DiceRoll | null;
  animatedDiceRollId: number;
  // Card shown by a show_card animation instruction.
  activeAnimationCard: ActiveCard | null;
  // Set while a wait_for_player gate is open. Both fields carry the same gate id.
  pendingInteractionId:       string | null;
  pendingAnimationInteraction: PendingAnimationInteraction | null;

  // Overlays / modals
  activeDeed:  DeedInfo | null;
  openedModal: ModalKind;

  // Board interaction
  hoveredTile:  number | null;
  selectedTile: number | null;

  // Actions
  setIsRolling:   (v: boolean) => void;
  setWalkState:   (v: WalkState | null) => void;
  setIsTimelineRunning: (v: boolean) => void;
  setAnimatedDiceRoll:  (v: DiceRoll | null) => void;
  bumpAnimatedDiceRollId: () => void;
  setActiveAnimationCard: (v: ActiveCard | null) => void;
  setPendingInteractionId: (v: string | null) => void;
  setPendingAnimationInteraction: (v: PendingAnimationInteraction | null) => void;
  setActiveDeed:  (v: DeedInfo | null) => void;
  setOpenedModal: (v: ModalKind) => void;
  setHoveredTile: (v: number | null) => void;
  setSelectedTile:(v: number | null) => void;
  reset:          () => void;
}

const INITIAL: Pick<UiStore,
  | 'isRolling' | 'walkState' | 'isTimelineRunning'
  | 'animatedDiceRoll' | 'animatedDiceRollId' | 'activeAnimationCard'
  | 'pendingInteractionId' | 'pendingAnimationInteraction'
  | 'activeDeed' | 'openedModal' | 'hoveredTile' | 'selectedTile'
> = {
  isRolling:                   false,
  walkState:                   null,
  isTimelineRunning:           false,
  animatedDiceRoll:            null,
  animatedDiceRollId:          0,
  activeAnimationCard:         null,
  pendingInteractionId:        null,
  pendingAnimationInteraction: null,
  activeDeed:                  null,
  openedModal:                 null,
  hoveredTile:                 null,
  selectedTile:                null,
};

export const useUiStore = create<UiStore>((set) => ({
  ...INITIAL,

  setIsRolling:   (v) => set({ isRolling: v }),
  setWalkState:   (v) => set({ walkState: v }),
  setIsTimelineRunning: (v) => set({ isTimelineRunning: v }),
  setAnimatedDiceRoll:  (v) => set({ animatedDiceRoll: v }),
  bumpAnimatedDiceRollId: () => set((s) => ({ animatedDiceRollId: s.animatedDiceRollId + 1 })),
  setActiveAnimationCard: (v) => set({ activeAnimationCard: v }),
  setPendingInteractionId: (v) => set({ pendingInteractionId: v }),
  setPendingAnimationInteraction: (v) => set({ pendingAnimationInteraction: v }),
  setActiveDeed:  (v) => set({ activeDeed: v }),
  setOpenedModal: (v) => set({ openedModal: v }),
  setHoveredTile: (v) => set({ hoveredTile: v }),
  setSelectedTile:(v) => set({ selectedTile: v }),
  reset:          ()  => set({ ...INITIAL }),
}));
