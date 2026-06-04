'use client';

import type { KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import {
  BOARD_TILE_COLORS,
  GAME_BOARD_COLORS,
  SPACE_SURFACE_MAP,
  SPACE_SYMBOL_MAP,
} from '../../game-board.colors';
import type { BoardTileProps } from '../../game-board.types';
import { PlayerMarker } from '../PlayerMarker';
import {
  getTilePadding,
  shadowEmoji,
  shadowOnColor,
  specialEmojiSize,
  specialNameSize,
  specialPriceSize,
  TILE_INTERACTIVE,
  TILE_SHADOW,
} from './constants';
import { DimOverlay, MortgageOverlay, OwnershipOverlay, TileSheen } from './Overlays';
import { SelectionRing } from './SelectionRing';

export function SpecialTile({
  space,
  edge,
  ownership,
  ownerColor,
  players,
  walkingPlayerIds,
  isSelected = false,
  selectionTone = null,
  isDimmed = false,
  onSelect,
}: BoardTileProps) {
  const tBoard   = useTranslations('Board') as unknown as (key: string) => string;
  const tileName = tBoard(`tiles.p${space.pos}`);

  const isSelectable = Boolean(onSelect);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  return (
    <article
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      aria-pressed={isSelectable ? isSelected : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[12px] border text-center',
        isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        isSelectable && TILE_INTERACTIVE,
      )}
      style={{
        backgroundColor: SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.special,
        borderColor:     BOARD_TILE_COLORS.propertyOrange,
        color:           BOARD_TILE_COLORS.altText,
        padding:         getTilePadding(),
        gap:             '0.2em',
        boxShadow:       TILE_SHADOW,
      }}
    >
      <TileSheen />
      <span
        className="relative z-[45] shrink-0 leading-none"
        style={{ fontSize: specialEmojiSize, textShadow: shadowEmoji }}
      >
        {SPACE_SYMBOL_MAP[space.type]}
      </span>
      <div className="relative z-[45] min-w-0 overflow-hidden w-full text-center">
        <h3
          className="break-all font-sans font-bold uppercase leading-tight overflow-hidden"
          style={{ fontSize: specialNameSize, textShadow: shadowOnColor }}
        >
          {tileName}
        </h3>
        {space.price != null && (
          <p
            className="font-sans font-semibold overflow-hidden whitespace-nowrap"
            style={{ fontSize: specialPriceSize, opacity: 0.85, textShadow: shadowOnColor }}
          >
            Pay ${space.price}
          </p>
        )}
      </div>
      <PlayerMarker players={players} edge={edge} walkingPlayerIds={walkingPlayerIds} />
      {ownerColor && <OwnershipOverlay color={ownerColor} isMortgaged={ownership?.isMortgaged ?? false} />}
      {ownership?.isMortgaged && <MortgageOverlay />}
      {isDimmed && <DimOverlay />}
      <SelectionRing selected={isSelected} tone={selectionTone} />
    </article>
  );
}
