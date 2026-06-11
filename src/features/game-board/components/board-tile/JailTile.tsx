'use client';

import type { KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { CORNER_COLOR_MAP } from '../../game-board.colors';
import { CornerVariant } from '../../game-board.enums';
import type { BoardPlayer, BoardTileProps } from '../../game-board.types';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { TokenShapeSvg } from '../TokenShapeSvg';
import {
  BOARD_TILE_COLORS,
  GAME_BOARD_COLORS,
  getTilePadding,
  shadowOnColor,
  TILE_INTERACTIVE,
  TILE_SHADOW,
} from './constants';
import { DimOverlay, TileSheen } from './Overlays';
import { SelectionRing } from './SelectionRing';

// Jail sits at pos 10 (bottom-left corner): the board interior is up-and-right,
// so the barred cell occupies the top-right and the "Just Visiting" margin wraps
// the bottom-left L.

const JAIL_BG    = CORNER_COLOR_MAP[CornerVariant.JAIL]; // warm orange
const CELL_BG    = GAME_BOARD_COLORS.tile;               // cream cell interior
const BAR_COLOR  = '#3A2A18';                            // dark prison bars

function JailTokenRow({ players, size }: { players: BoardPlayer[]; size: string }) {
  return (
    <>
      {players.slice(0, 4).map((player) => (
        <TokenShapeSvg
          key={player.id}
          shape={player.tokenShape}
          color={player.tokenColor}
          avatarUrl={player.avatarUrl}
          size={size}
        />
      ))}
    </>
  );
}

export function JailTile({
  space,
  gameMode = GameMode.NORMAL,
  players,
  isSelected = false,
  selectionTone = null,
  isDimmed = false,
  onSelect,
}: BoardTileProps) {
  const tBoard = useTranslations('Board') as unknown as (key: string) => string;

  const isSelectable = Boolean(onSelect);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  const jailed   = (players ?? []).filter((p) => p.inJail);
  const visiting = (players ?? []).filter((p) => !p.inJail);

  return (
    <article
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      aria-pressed={isSelectable ? isSelected : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-[16px] border',
        isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        isSelectable && TILE_INTERACTIVE,
      )}
      style={{
        backgroundColor: JAIL_BG,
        borderColor:     JAIL_BG,
        color:           BOARD_TILE_COLORS.altText,
        padding:         getTilePadding(),
        boxShadow:       TILE_SHADOW,
      }}
    >
      <TileSheen />

      {/* "Just Visiting" margin — runs along the bottom edge of the outer L */}
      <span
        className="absolute bottom-[3%] left-[4%] z-[2] font-sans font-black uppercase leading-none"
        style={{
          fontSize:   'clamp(6px, 0.95vmin, 12px)',
          letterSpacing: '0.12em',
          color:      BOARD_TILE_COLORS.altText,
          textShadow: shadowOnColor,
          opacity:    0.92,
        }}
      >
        {tBoard('justVisiting')}
      </span>

      {/* Visiting tokens — clustered in the open bottom-left corner */}
      {visiting.length > 0 && (
        <div className="absolute bottom-[16%] left-[6%] z-[3] flex max-w-[42%] flex-wrap items-end gap-[3px]">
          <JailTokenRow players={visiting} size="clamp(15px, 1.9vmin, 28px)" />
        </div>
      )}

      {/* The barred cell — inner corner (top-right) */}
      <div
        className="absolute right-[5%] top-[5%] z-[4] flex h-[56%] w-[56%] flex-col overflow-hidden rounded-[10px] border-2"
        style={{
          backgroundColor: CELL_BG,
          borderColor:     BAR_COLOR,
          boxShadow:       'inset 0 1px 3px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.25)',
        }}
      >
        {/* IN JAIL header — solid strip so the label is never crossed by bars */}
        <div
          className="flex shrink-0 items-center justify-center"
          style={{ backgroundColor: BAR_COLOR, paddingBlock: 'clamp(2px, 0.35vmin, 5px)' }}
        >
          <span
            className="text-center font-sans font-black uppercase leading-none"
            style={{
              fontSize:      'clamp(6px, 0.95vmin, 12px)',
              letterSpacing: '0.14em',
              color:         CELL_BG,
            }}
          >
            {tBoard('inJail')}
          </span>
        </div>

        {/* Cell body — prison bars over the jailed tokens */}
        <div className="relative flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 13%, ${BAR_COLOR} 13%, ${BAR_COLOR} 17%)`,
              opacity: 0.8,
            }}
          />
          <div className="relative z-[1] flex h-full flex-wrap items-center justify-center gap-[2px] p-[3px]">
            <JailTokenRow players={jailed} size="clamp(13px, 1.7vmin, 24px)" />
          </div>
        </div>
      </div>

      {isDimmed && <DimOverlay />}
      <SelectionRing selected={isSelected} tone={selectionTone} />

      {/* keep the tile name available to assistive tech without cluttering the art */}
      <span className="sr-only">{tBoard(`tiles.${gameMode}.p${space.pos}`)}</span>
    </article>
  );
}
