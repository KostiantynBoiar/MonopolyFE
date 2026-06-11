'use client';

import type { KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { CORNER_COLOR_MAP } from '../../game-board.colors';
import { CornerVariant } from '../../game-board.enums';
import type { BoardTileProps } from '../../game-board.types';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { BuildingsMarker } from '../BuildingsMarker';
import { PlayerMarker } from '../PlayerMarker';
import {
  BOARD_TILE_COLORS,
  CORNER_SYMBOL_MAP,
  cornerEmojiSize,
  cornerNameSize,
  cornerSubSize,
  getTilePadding,
  shadowEmoji,
  shadowOnColor,
  TILE_INTERACTIVE,
  TILE_SHADOW,
} from './constants';
import { DimOverlay, TileSheen } from './Overlays';
import { SelectionRing } from './SelectionRing';

export function CornerTile({
  space,
  edge,
  gameMode = GameMode.NORMAL,
  ownership,
  players,
  walkingPlayerIds,
  isSelected = false,
  selectionTone = null,
  isDimmed = false,
  onSelect,
}: BoardTileProps) {
  const tBoard    = useTranslations('Board') as unknown as (key: string) => string;
  const tileName  = tBoard(`tiles.${gameMode}.p${space.pos}`);
  const justVisit = tBoard('justVisiting');

  const isSelectable = Boolean(onSelect);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  if (!space.corner) return null;

  const cornerColor = CORNER_COLOR_MAP[space.corner];

  return (
    <article
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      aria-pressed={isSelectable ? isSelected : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[16px] border',
        isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        isSelectable && TILE_INTERACTIVE,
      )}
      style={{
        backgroundColor: cornerColor,
        borderColor:     cornerColor,
        color:           BOARD_TILE_COLORS.altText,
        padding:         getTilePadding(),
        gap:             '0.3em',
        boxShadow:       TILE_SHADOW,
      }}
    >
      <TileSheen />
      <span
        className="relative z-[2] shrink-0 leading-none"
        style={{ fontSize: cornerEmojiSize, textShadow: shadowEmoji }}
      >
        {CORNER_SYMBOL_MAP[space.corner]}
      </span>
      <h3
        className="relative z-[2] break-all text-center font-sans font-black uppercase leading-tight overflow-hidden w-full"
        style={{ fontSize: cornerNameSize, color: BOARD_TILE_COLORS.altText, textShadow: shadowOnColor }}
      >
        {tileName}
      </h3>
      {space.corner === CornerVariant.JAIL && (
        <p
          className="relative z-[2] font-sans uppercase tracking-[0.18em] overflow-hidden whitespace-nowrap"
          style={{ fontSize: cornerSubSize, color: BOARD_TILE_COLORS.altText, opacity: 0.80, textShadow: shadowOnColor }}
        >
          {justVisit}
        </p>
      )}
      <BuildingsMarker ownership={ownership} edge={edge} />
      <PlayerMarker players={players} edge={edge} walkingPlayerIds={walkingPlayerIds} />
      {isDimmed && <DimOverlay />}
      <SelectionRing selected={isSelected} tone={selectionTone} />
    </article>
  );
}
