'use client';

import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, SPACE_SURFACE_MAP, SPACE_SYMBOL_MAP } from '../boardTile.colors';
import {
  getTilePadding,
  shadowEmoji,
  shadowOnColor,
  specialEmojiSize,
  specialNameSize,
  specialPriceSize,
  TILE_SHADOW,
} from '../boardTile.constants';
import type { BoardTileProps } from '../boardTile.schema';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { PlayerMarker } from './PlayerMarker';
import { TileBase } from './TileBase';

export function SpecialTile({
  space,
  edge,
  gameMode = GameMode.NORMAL,
  players,
  walkingPlayerIds,
  isSelected,
  selectionTone,
  isDimmed,
  onSelect,
}: BoardTileProps) {
  const tBoard   = useTranslations('Board') as unknown as (key: string) => string;
  const tileName = tBoard(`tiles.${gameMode}.p${space.pos}`);

  return (
    <TileBase
      isSelected={isSelected}
      selectionTone={selectionTone}
      isDimmed={isDimmed}
      onSelect={onSelect}
      className="flex h-full w-full flex-col items-center justify-center rounded-[12px] text-center"
      style={{
        backgroundColor: SPACE_SURFACE_MAP[space.type] ?? 'var(--board-special)',
        borderColor:     BOARD_TILE_COLORS.propertyOrange,
        color:           BOARD_TILE_COLORS.altText,
        padding:         getTilePadding(),
        gap:             '0.2em',
        boxShadow:       TILE_SHADOW,
      }}
    >
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
    </TileBase>
  );
}
