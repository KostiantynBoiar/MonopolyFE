'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import {
  CARD_FLIP_TRIGGER_DELAY_MS,
  CARD_FLIP_DURATION_MS,
  CARD_PROCEED_APPEAR_DELAY_MS,
} from '@/shared/config/constants';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import { CardFlipState, CardKind } from '../card.enums';
import type { CardFlipOverlayProps } from '../card.types';

// ─── Card theme — colors match board tile palette ─────────────────────────────
const CARD_THEME = {
  [CardKind.CHANCE]: {
    accentColor: BOARD_TILE_COLORS.propertyYellow,
    backGlyph:   '🎲',
  },
  [CardKind.COMMUNITY_CHEST]: {
    accentColor: BOARD_TILE_COLORS.propertyCyan,
    backGlyph:   '🎁',
  },
} as const;

// ─── Card faces ───────────────────────────────────────────────────────────────

function CardFront({ card, label }: { card: CardFlipOverlayProps['card']; label: string }) {
  const theme = CARD_THEME[card.kind as CardKind] ?? CARD_THEME[CardKind.CHANCE];

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-[14px] shadow-lg"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        border: `1.5px solid ${GAME_BOARD_COLORS.border}`,
      }}
    >
      {/* Color band header */}
      <div
        className="flex shrink-0 items-center justify-center py-3"
        style={{ backgroundColor: theme.accentColor }}
      >
        <span
          className="font-display font-black uppercase"
          style={{ fontSize: '0.65rem', letterSpacing: '0.22em', color: BOARD_TILE_COLORS.altText }}
        >
          {label}
        </span>
      </div>

      {/* Card text */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-4">
        <p
          className="text-center font-sans font-medium leading-snug"
          style={{ fontSize: '0.88rem', color: GAME_BOARD_COLORS.text }}
        >
          {card.text}
        </p>
      </div>

      {/* Footer stripe */}
      <div style={{ height: '6px', flexShrink: 0, backgroundColor: theme.accentColor }} />
    </div>
  );
}

function CardBack({ card, label }: { card: CardFlipOverlayProps['card']; label: string }) {
  const theme = CARD_THEME[card.kind as CardKind] ?? CARD_THEME[CardKind.CHANCE];

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-[14px] shadow-lg"
      style={{
        backgroundColor: theme.accentColor,
        border: '2px solid rgba(255,255,255,0.25)',
      }}
    >
      <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>
        {theme.backGlyph}
      </span>
      <span
        className="font-display font-black uppercase"
        style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.82)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── CardFlipOverlay ──────────────────────────────────────────────────────────

export function CardFlipOverlay({ card, onProceed, canProceed = true }: CardFlipOverlayProps) {
  const t = useTranslations('Card');
  const label = t(card.kind as CardKind);
  const [flipState, setFlipState] = useState<CardFlipState>(CardFlipState.IDLE);
  const [showProceed, setShowProceed] = useState(false);

  useEffect(() => {
    const flipTimer = setTimeout(() => setFlipState(CardFlipState.FLIPPING), CARD_FLIP_TRIGGER_DELAY_MS);
    return () => clearTimeout(flipTimer);
  }, []);

  useEffect(() => {
    if (flipState !== CardFlipState.FLIPPING) return;
    const revealTimer = setTimeout(() => setFlipState(CardFlipState.REVEALED), CARD_FLIP_DURATION_MS);
    return () => clearTimeout(revealTimer);
  }, [flipState]);

  useEffect(() => {
    if (flipState !== CardFlipState.REVEALED) return;
    const proceedTimer = setTimeout(
      () => setShowProceed(true),
      CARD_PROCEED_APPEAR_DELAY_MS - CARD_FLIP_DURATION_MS,
    );
    return () => clearTimeout(proceedTimer);
  }, [flipState]);

  const isFlipped = flipState === CardFlipState.FLIPPING || flipState === CardFlipState.REVEALED;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      {/* 3-D flip card */}
      <div style={{ perspective: '700px', height: '14em', width: '9.5em' }}>
        <div
          style={{
            transformStyle:  'preserve-3d',
            transition:      `transform ${CARD_FLIP_DURATION_MS}ms cubic-bezier(0.45, 0.05, 0.55, 0.95)`,
            transform:       isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position:        'relative',
            width:           '100%',
            height:          '100%',
          }}
        >
          {/* Back face */}
          <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
            <CardBack card={card} label={label} />
          </div>

          {/* Front face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              transform:          'rotateY(180deg)',
              position:           'absolute',
              inset:              0,
            }}
          >
            <CardFront card={card} label={label} />
          </div>
        </div>
      </div>

      {/* Proceed button */}
      <button
        type="button"
        onClick={onProceed}
        className={cn(
          'rounded-[10px] border px-6 py-2.5 font-display font-bold uppercase tracking-wide',
          'transition-all duration-300',
          showProceed ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor: BOARD_TILE_COLORS.propertyBlue,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        {t('proceed')}
      </button>
    </div>
  );
}
