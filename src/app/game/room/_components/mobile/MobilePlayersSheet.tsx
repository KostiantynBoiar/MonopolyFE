'use client';

import { useEffect } from 'react';
import { PlayerPanel } from '@/features/game-board/components/PlayerPanel';
import type { Player } from '@/features/player-panel';
import type { LogEntry } from '@/shared/protocol/game-state';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

interface MobilePlayersSheetProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  log?: LogEntry[];
  viewerId?: string;
  createdAt?: string;
  onSurrender?: () => void;
}

export function MobilePlayersSheet({
  open,
  onClose,
  players,
  log,
  viewerId,
  createdAt,
  onSurrender,
}: MobilePlayersSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20,16,12,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 top-[10dvh] flex flex-col overflow-hidden rounded-t-[20px]"
        style={{ backgroundColor: GAME_BOARD_COLORS.panel }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: GAME_BOARD_COLORS.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-sm font-bold"
            style={{ color: GAME_BOARD_COLORS.muted }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <PlayerPanel
            players={players}
            log={log}
            viewerId={viewerId}
            createdAt={createdAt}
            onSurrender={onSurrender}
          />
        </div>
      </div>
    </div>
  );
}
