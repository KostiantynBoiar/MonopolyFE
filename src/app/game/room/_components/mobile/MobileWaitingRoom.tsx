'use client';

import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { WaitingCenterGrid } from '../WaitingCenterGrid';
import type { ChatMessage } from '@/features/chat/chat.types';
import type { MemberRole } from '@/features/lobby';

interface MobileWaitingRoomProps {
  inviteCode: string;
  memberCount: number;
  maxPlayers: number;
  yourRole: MemberRole | null;
  messages: ChatMessage[];
  viewerUserId?: string;
  isLeaving?: boolean;
  isStarting?: boolean;
  onLeave: () => void;
  onStart: () => void;
  onSendMessage?: (text: string) => void;
  onSendSticker?: (url: string) => void;
}

export function MobileWaitingRoom(props: MobileWaitingRoomProps) {
  return (
    <div
      className="flex h-[100dvh] w-full flex-col p-3"
      style={{
        backgroundColor: GAME_BOARD_COLORS.ink,
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <WaitingCenterGrid {...props} />
    </div>
  );
}
