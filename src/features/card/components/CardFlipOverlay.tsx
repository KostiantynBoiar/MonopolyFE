'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import {
  CARD_FLIP_TRIGGER_DELAY_MS,
  CARD_FLIP_DURATION_MS,
  CARD_PROCEED_APPEAR_DELAY_MS,
} from '@/shared/config/constants';
import { CardFlipState, CardKind } from '../card.enums';
import type { CardFlipOverlayProps } from '../card.types';

// ─── Theme per card kind ──────────────────────────────────────────────────────

const CARD_THEME = {
  [CardKind.CHANCE]: {
    bandBg:    'bg-band-orange',
    backBg:    'bg-band-orange',
    backLabel: 'CHANCE',
    backGlyph: '?',
    label:     'CHANCE',
  },
  [CardKind.COMMUNITY_CHEST]: {
    bandBg:    'bg-band-cyan',
    backBg:    'bg-band-cyan',
    backLabel: 'COMMUNITY CHEST',
    backGlyph: '📦',
    label:     'COMMUNITY CHEST',
  },
} as const;

// ─── Card face (front) ────────────────────────────────────────────────────────

function CardFront({ card }: { card: CardFlipOverlayProps['card'] }) {
  const theme = CARD_THEME[card.kind as CardKind] ?? CARD_THEME[CardKind.CHANCE];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-ink/20 bg-white shadow-xl">
      {/* Color band header */}
      <div className={cn('flex shrink-0 items-center justify-center py-3', theme.bandBg)}>
        <span className="font-display text-[0.65em] font-bold uppercase tracking-widest text-white">
          {theme.label}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-4">
        <p className="text-center font-sans text-[0.78em] font-medium leading-snug text-ink">
          {card.text}
        </p>
      </div>

      {/* Footer stripe */}
      <div className={cn('h-1.5 shrink-0', theme.bandBg)} />
    </div>
  );
}

// ─── Card back ────────────────────────────────────────────────────────────────

function CardBack({ card }: { card: CardFlipOverlayProps['card'] }) {
  const theme = CARD_THEME[card.kind as CardKind] ?? CARD_THEME[CardKind.CHANCE];

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-3',
        'rounded-xl border-2 border-white/30 shadow-xl',
        theme.backBg,
      )}
    >
      <span className="font-display text-[2.5em] font-black leading-none text-white/90">
        {theme.backGlyph}
      </span>
      <span className="font-display text-[0.55em] font-bold uppercase tracking-widest text-white/70">
        {theme.backLabel}
      </span>
    </div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function CardFlipOverlay({ card, onProceed }: CardFlipOverlayProps) {
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
    const proceedTimer = setTimeout(() => setShowProceed(true), CARD_PROCEED_APPEAR_DELAY_MS - CARD_FLIP_DURATION_MS);
    return () => clearTimeout(proceedTimer);
  }, [flipState]);

  const isFlipped = flipState === CardFlipState.FLIPPING || flipState === CardFlipState.REVEALED;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      {/* 3-D flip card */}
      <div
        style={{ perspective: '700px' }}
        className="h-[13.5em] w-[9em]"
      >
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
          <div
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
          >
            <CardBack card={card} />
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
            <CardFront card={card} />
          </div>
        </div>
      </div>

      {/* Proceed button */}
      <button
        onClick={onProceed}
        className={cn(
          'rounded border border-gold-600 bg-gold px-5 font-display font-semibold uppercase tracking-wide text-white',
          'transition-all duration-300 hover:bg-gold-600',
          'text-[0.68em]',
          showProceed ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-1',
        )}
        style={{ padding: '0.55em 1.2em' }}
      >
        Proceed
      </button>
    </div>
  );
}
