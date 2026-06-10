'use client';

import { useTranslations } from 'next-intl';
import { DiceWindow } from '@/features/dice/components/DiceWindow';
import { DeedWindow } from '@/features/deed/components/DeedWindow';
import { BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import type { DiceRoll } from '@/shared/protocol/game-state';
import {
  ACTION_CLASS,
  DISABLED_ACTION,
  accentAction,
} from '../action-button.styles';

interface MobileActionRowProps {
  diceRoll: DiceRoll | null;
  animatedDiceRollId: number;
  canRoll: boolean;
  canEndTurn: boolean;
  isRolling: boolean;
  isBuyDecisionForViewer: boolean;
  deedPanelSpace: BoardSpace;
  pendingBuySpace: BoardSpace | null;
  canBuyProperty: boolean;
  onRoll: () => void;
  onEndTurn: () => void;
  onBuy: () => void;
  onAuction: () => void;
}

const dimStyle = (dim: boolean) => ({
  opacity: dim ? 0.15 : 1,
  filter: dim ? 'saturate(0.82)' : 'saturate(1)',
  transition: 'opacity 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms cubic-bezier(0.22, 1, 0.36, 1)',
});

export function MobileActionRow({
  diceRoll,
  animatedDiceRollId,
  canRoll,
  canEndTurn,
  isRolling,
  isBuyDecisionForViewer,
  deedPanelSpace,
  pendingBuySpace,
  canBuyProperty,
  onRoll,
  onEndTurn,
  onBuy,
  onAuction,
}: MobileActionRowProps) {
  const t = useTranslations('Game');

  return (
    <div className="grid h-full grid-cols-[1fr_auto_1fr] gap-2">
      {/* Dice card */}
      <div className="min-w-0 overflow-hidden rounded-[14px]" style={dimStyle(isBuyDecisionForViewer)}>
        <DiceWindow diceRoll={diceRoll} rollId={animatedDiceRollId} compact />
      </div>

      {/* Primary action — Roll ⇄ End Turn */}
      <div className="flex w-16 flex-col" style={dimStyle(isBuyDecisionForViewer)}>
        {canEndTurn ? (
          <button
            type="button"
            onClick={onEndTurn}
            className={`${ACTION_CLASS} h-full w-full font-display text-xs font-black uppercase tracking-[0.1em]`}
            style={accentAction(BOARD_TILE_COLORS.propertyRed, '0 2px 10px rgba(228,135,135,0.45)')}
          >
            {t('endTurn')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRoll}
            disabled={!canRoll}
            className={`${ACTION_CLASS} h-full w-full font-display text-xs font-black uppercase tracking-[0.1em]`}
            style={canRoll
              ? accentAction(BOARD_TILE_COLORS.propertyGreen, '0 2px 10px rgba(121,180,143,0.45)')
              : DISABLED_ACTION}
          >
            {isRolling ? t('rolling') : t('roll')}
          </button>
        )}
      </div>

      {/* Deed card */}
      <div className="min-w-0 overflow-hidden rounded-[14px]">
        <DeedWindow
          space={deedPanelSpace}
          decisionSpace={isBuyDecisionForViewer ? pendingBuySpace : null}
          canAct={isBuyDecisionForViewer}
          canBuy={canBuyProperty}
          onBuy={onBuy}
          onAuction={onAuction}
          viewOnly={!isBuyDecisionForViewer}
          compact
        />
      </div>
    </div>
  );
}
