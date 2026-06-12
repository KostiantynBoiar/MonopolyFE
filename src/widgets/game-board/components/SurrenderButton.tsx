'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

// Surrender is destructive (you leave the game), so it takes a confirming second click.
export function SurrenderButton({ onSurrender }: { onSurrender: () => void }) {
  const t = useTranslations('Game');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      onClick={() => {
        if (confirming) {
          onSurrender();
          setConfirming(false);
        } else {
          setConfirming(true);
        }
      }}
      className="w-full rounded-[8px] border font-display font-bold uppercase tracking-[0.08em] transition-colors"
      style={{
        fontSize: 'clamp(8px,1.1vmin,11px)',
        padding: 'clamp(2px,0.35vmin,5px) 4px',
        backgroundColor: confirming ? BOARD_TILE_COLORS.propertyRed : GAME_BOARD_COLORS.surface,
        borderColor: confirming ? BOARD_TILE_COLORS.propertyRed : GAME_BOARD_COLORS.border,
        color: confirming ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.muted,
      }}
    >
      {confirming ? t('surrenderConfirm') : t('surrender')}
    </button>
  );
}
