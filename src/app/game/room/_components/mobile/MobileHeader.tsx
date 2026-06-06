'use client';

import { useTranslations } from 'next-intl';
import type { Player } from '@/features/player-panel';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { SettingsControl } from '@/shared/ui';

interface MobileHeaderProps {
  players: Player[];
  viewerId?: string;
  onOpenPlayers: () => void;
}

export function MobileHeader({ players, viewerId, onOpenPlayers }: MobileHeaderProps) {
  const t = useTranslations('Player');
  const activePlayer = players.find((p) => p.isActive);
  const isViewerTurn = activePlayer?.id === viewerId;

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2 rounded-[14px] border px-3"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {/* Active player indicator */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {activePlayer && (
          <span
            className="h-3 w-3 shrink-0 rounded-full border-2 border-white/30"
            style={{ backgroundColor: TOKEN_COLORS[activePlayer.token] }}
          />
        )}
        <span className="truncate text-sm font-semibold" style={{ color: GAME_BOARD_COLORS.text }}>
          {isViewerTurn
            ? t('currentTurn')
            : activePlayer
            ? activePlayer.name
            : '…'}
        </span>
      </div>

      <SettingsControl className="h-7 w-7 shrink-0" />

      {/* Players button */}
      <button
        type="button"
        onClick={onOpenPlayers}
        className="flex shrink-0 items-center gap-1 rounded-[10px] border px-2 py-1 text-xs font-bold uppercase tracking-[0.08em]"
        style={{
          backgroundColor: GAME_BOARD_COLORS.surface,
          borderColor: GAME_BOARD_COLORS.border,
          color: GAME_BOARD_COLORS.text,
        }}
      >
        {/* Token dots */}
        <span className="flex -space-x-1">
          {players.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className="h-3 w-3 rounded-full border border-white/30"
              style={{ backgroundColor: TOKEN_COLORS[p.token] }}
            />
          ))}
        </span>
        <span>{players.length}</span>
      </button>
    </div>
  );
}
