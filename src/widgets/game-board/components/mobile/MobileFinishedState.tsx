'use client';

import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { FinishedGameState } from '../RoomStates';

interface MobileFinishedStateProps {
  winnerName: string | null;
  onLeave: () => void;
  isLeaving: boolean;
}

export function MobileFinishedState(props: MobileFinishedStateProps) {
  return (
    <div
      className="flex h-[100dvh] w-full flex-col p-3"
      style={{
        backgroundColor: GAME_BOARD_COLORS.ink,
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <FinishedGameState {...props} />
    </div>
  );
}
