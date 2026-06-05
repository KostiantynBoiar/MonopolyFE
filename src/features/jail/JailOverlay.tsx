'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDialog } from '@/shared/hooks/useDialog';
import type { DiceRoll } from '@/shared/protocol/game-state';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';

// ─── Sub-component ────────────────────────────────────────────────────────────

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    if (!rolling) { setDisplayed(value); return; }
    const iv = setInterval(() => setDisplayed(Math.ceil(Math.random() * 6)), 80);
    return () => clearInterval(iv);
  }, [rolling, value]);

  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[8px]"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        border: `1.5px solid ${GAME_BOARD_COLORS.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
      }}
    >
      <span
        className="font-display font-black leading-none"
        style={{ fontSize: '1.1rem', color: GAME_BOARD_COLORS.text }}
      >
        {displayed}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JailOverlayProps {
  attempts:   number;
  canPayFine: boolean;
  canUseCard: boolean;
  canRoll:    boolean;
  diceRoll?:  DiceRoll | null;
  isRolling?: boolean;
  onPayFine:  () => void;
  onUseCard:  () => void;
  onRoll:     () => void;
}

// ─── JailOverlay ─────────────────────────────────────────────────────────────

export function JailOverlay({
  attempts, canPayFine, canUseCard, canRoll,
  diceRoll = null, isRolling = false,
  onPayFine, onUseCard, onRoll,
}: JailOverlayProps) {
  const t = useTranslations('Jail');
  const dialog = useDialog<HTMLDivElement>({ label: t('inJail') });
  const triesLeft = Math.max(0, attempts);
  const showDice = isRolling || diceRoll !== null;
  const accentColor = triesLeft > 0 ? BOARD_TILE_COLORS.propertyOrange : BOARD_TILE_COLORS.propertyRed;

  return (
    <div
      {...dialog}
      className="flex h-full w-full flex-col overflow-y-auto rounded-[16px] border focus:outline-none"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {/* Accent strip — matches jail corner tile color */}
      <div style={{ height: '4px', backgroundColor: BOARD_TILE_COLORS.propertyOrange, flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-3 px-5 py-3"
        style={{
          backgroundColor: GAME_BOARD_COLORS.panel,
          borderBottom: `1px solid ${GAME_BOARD_COLORS.border}`,
        }}
      >
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🔒</span>
        <div className="min-w-0">
          <p
            className="font-mono font-semibold uppercase"
            style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: GAME_BOARD_COLORS.muted }}
          >
            {t('inJail')}
          </p>
          <h2
            className="font-display font-black uppercase leading-tight"
            style={{ fontSize: '1.05rem', color: GAME_BOARD_COLORS.text }}
          >
            {t('getOut')}
          </h2>
        </div>
        <span
          className="ml-auto shrink-0 rounded-full px-2.5 py-1 font-mono font-semibold uppercase"
          style={{
            fontSize: '0.58rem',
            letterSpacing: '0.1em',
            backgroundColor: accentColor,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          {triesLeft > 0 ? t('triesLeft', { count: triesLeft }) : t('noTriesLeft')}
        </span>
      </div>

      {/* Dice result */}
      {showDice && (
        <div
          className="flex shrink-0 flex-col items-center gap-2 px-5 py-3"
          style={{ borderBottom: `1px solid ${GAME_BOARD_COLORS.border}` }}
        >
          <div className="flex items-center gap-3">
            <DiceFace value={isRolling ? 1 : (diceRoll?.die1 ?? 1)} rolling={isRolling} />
            <DiceFace value={isRolling ? 1 : (diceRoll?.die2 ?? 1)} rolling={isRolling} />
          </div>
          {!isRolling && diceRoll && (
            <p
              className="font-mono font-semibold"
              style={{ fontSize: '0.7rem', color: GAME_BOARD_COLORS.muted }}
            >
              {diceRoll.die1 + diceRoll.die2}
              {' — '}{diceRoll.isDoubles ? t('doubles') : t('noDoubles')}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-2 px-5 py-4">
        <button
          type="button"
          onClick={onRoll}
          disabled={!canRoll}
          className="w-full rounded-[10px] border py-2.5 font-display font-bold uppercase tracking-wide transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            borderColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          {t('rollForDoubles')}
        </button>
        <button
          type="button"
          onClick={onPayFine}
          disabled={!canPayFine}
          className="w-full rounded-[10px] border py-2.5 font-display font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            backgroundColor: GAME_BOARD_COLORS.panel,
            borderColor: GAME_BOARD_COLORS.border,
            color: GAME_BOARD_COLORS.text,
          }}
        >
          {t('payFine')}
        </button>
        <button
          type="button"
          onClick={onUseCard}
          disabled={!canUseCard}
          className="w-full rounded-[10px] border py-2.5 font-display font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            backgroundColor: GAME_BOARD_COLORS.panel,
            borderColor: GAME_BOARD_COLORS.border,
            color: GAME_BOARD_COLORS.text,
          }}
        >
          {t('useCard')}
        </button>
      </div>
    </div>
  );
}
