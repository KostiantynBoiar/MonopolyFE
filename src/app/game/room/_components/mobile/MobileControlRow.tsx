'use client';

import { useTranslations } from 'next-intl';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TurnTimer } from '../TurnTimer';
import { SurrenderButton } from '../SurrenderButton';
import {
  ACTION_CLASS,
  DISABLED_ACTION,
  GHOST_ACTION,
} from '../action-button.styles';

interface MobileControlRowProps {
  canManage: boolean;
  canTrade: boolean;
  hasOtherTraders: boolean;
  isViewerTurn: boolean;
  roundNumber: number;
  turnDeadlineMs: number | null;
  canSurrender: boolean;
  onManageOpen: () => void;
  onTradeOpen: () => void;
  onSurrender: () => void;
}

export function MobileControlRow({
  canManage,
  canTrade,
  hasOtherTraders,
  isViewerTurn,
  roundNumber,
  turnDeadlineMs,
  canSurrender,
  onManageOpen,
  onTradeOpen,
  onSurrender,
}: MobileControlRowProps) {
  const t = useTranslations('Game');

  return (
    <div className="flex shrink-0 gap-2" style={{ height: '48px' }}>
      <button
        type="button"
        onClick={onManageOpen}
        disabled={!canManage}
        className={`${ACTION_CLASS} flex-1 px-2 text-xs font-bold uppercase tracking-[0.08em]`}
        style={canManage ? GHOST_ACTION : DISABLED_ACTION}
      >
        {t('manage')}
      </button>

      <button
        type="button"
        onClick={onTradeOpen}
        disabled={!canTrade || !hasOtherTraders}
        className={`${ACTION_CLASS} flex-1 px-2 text-xs font-bold uppercase tracking-[0.08em]`}
        style={(canTrade && hasOtherTraders) ? GHOST_ACTION : DISABLED_ACTION}
      >
        {t('trade')}
      </button>

      {/* Status */}
      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] rounded-[14px] border px-2 text-center"
        style={{
          backgroundColor: GAME_BOARD_COLORS.surface,
          borderColor: GAME_BOARD_COLORS.border,
          color: GAME_BOARD_COLORS.muted,
          boxShadow: '0 1px 2px rgba(51,48,43,0.08)',
        }}
      >
        <TurnTimer deadlineMs={turnDeadlineMs} />
        {isViewerTurn && canSurrender ? (
          <SurrenderButton onSurrender={onSurrender} />
        ) : (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
            {isViewerTurn ? t('yourTurn') : t('round', { number: roundNumber })}
          </span>
        )}
      </div>
    </div>
  );
}
