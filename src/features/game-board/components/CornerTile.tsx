'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { CornerVariant } from '../game-board.enums';
import type { CornerTileProps } from '../game-board.types';

const CORNER_ACCENT: Record<CornerVariant, string> = {
  [CornerVariant.GO]:        'text-red',
  [CornerVariant.JAIL]:      'text-ink',
  [CornerVariant.PARKING]:   'text-ink',
  [CornerVariant.GOTO_JAIL]: 'text-ink',
};

const HAS_SUB: Record<CornerVariant, boolean> = {
  [CornerVariant.GO]:        true,
  [CornerVariant.JAIL]:      true,
  [CornerVariant.PARKING]:   false,
  [CornerVariant.GOTO_JAIL]: true,
};

export function CornerTile({ variant, className }: CornerTileProps) {
  const t = useTranslations('Corner');

  const label  = t(`${variant}.label`);
  const sub    = HAS_SUB[variant] ? t(`${variant}.sub`) : undefined;
  const accent = CORNER_ACCENT[variant];

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center border-[1.5px] border-ink bg-paper p-1',
        className,
      )}
    >
      <span className={cn('text-center font-display text-[0.6em] font-bold uppercase leading-tight', accent)}>
        {label}
      </span>
      {sub && (
        <span className="mt-0.5 text-center font-sans text-[0.38em] leading-tight text-muted">
          {sub}
        </span>
      )}
    </div>
  );
}
