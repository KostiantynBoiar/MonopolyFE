'use client';

import { useTranslations } from 'next-intl';
import { ChatWindow } from './ChatWindow';
import { DiceWindow } from '@/features/dice';
import type { BoardCenterPanelProps } from '../chat.types';

interface BoardCenterPanelComponentProps extends BoardCenterPanelProps {
  compact?: boolean;
}

export function BoardCenterPanel({
  log,
  diceRoll,
  diceRollId,
  isRolling,
  canRoll,
  canBuy,
  canManage,
  canTrade,
  canEndTurn,
  onRoll,
  onBuy,
  onManage,
  onTrade,
  onEndTurn,
  onSendMessage,
  compact,
}: BoardCenterPanelComponentProps) {
  const t = useTranslations('Game');
  return (
    <div className="flex h-full w-full flex-col bg-paper">
      {/* Game log and actions */}
      {(diceRoll || isRolling) && (
        <div className={`${compact ? 'h-32' : 'h-36'} shrink-0 border-b border-line bg-surface p-2`}>
          <DiceWindow diceRoll={diceRoll} rollId={diceRollId ?? 0} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatWindow
          log={log}
          onSendMessage={onSendMessage}
        />
      </div>

      {/* Action buttons */}
      <div className={`flex shrink-0 flex-wrap gap-2 border-t border-line bg-surface p-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <button
          onClick={onRoll}
          disabled={!canRoll}
          className="rounded bg-green px-3 py-1.5 font-bold text-white transition-colors hover:bg-green-600 disabled:bg-line disabled:text-muted"
        >
          {t('roll')}
        </button>
        {canBuy && (
          <button
            onClick={onBuy}
            className="rounded bg-blue px-3 py-1.5 font-bold text-white transition-colors hover:bg-blue-600"
          >
            {t('buyProperty')}
          </button>
        )}
        {canManage && (
          <button
            onClick={onManage}
            className="rounded bg-gold px-3 py-1.5 font-bold text-white transition-colors hover:bg-gold-600"
          >
            {t('manage')}
          </button>
        )}
        {canTrade && (
          <button
            onClick={onTrade}
            className="rounded bg-purple px-3 py-1.5 font-bold text-white transition-colors hover:bg-purple-600"
          >
            {t('trade')}
          </button>
        )}
        {canEndTurn && (
          <button
            onClick={onEndTurn}
            className="ml-auto rounded bg-red px-3 py-1.5 font-bold text-white transition-colors hover:bg-red-600"
          >
            {t('endTurn')}
          </button>
        )}
      </div>
    </div>
  );
}
