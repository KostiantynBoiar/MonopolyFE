'use client';

import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { EmptyGameState } from '../RoomStates';

interface MobileEmptyStateProps {
  sessionCode: string | null;
  status: string;
}

export function MobileEmptyState(props: MobileEmptyStateProps) {
  return (
    <div
      className="flex h-[100dvh] w-full flex-col p-3"
      style={{
        backgroundColor: GAME_BOARD_COLORS.ink,
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <EmptyGameState {...props} />
    </div>
  );
}
