'use client';

import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, CORNER_COLOR_MAP } from '../boardTile.colors';
import {
  CORNER_SYMBOL_MAP,
  cornerEmojiSize,
  cornerNameSize,
  getTilePadding,
  shadowEmoji,
  shadowOnColor,
  TILE_SHADOW,
} from '../boardTile.constants';
import type { BoardTileProps } from '../boardTile.schema';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { BuildingsMarker } from './BuildingsMarker';
import { PlayerMarker } from './PlayerMarker';
import { TileBase } from './TileBase';

export function CornerTile({
  space,
  edge,
  gameMode = GameMode.NORMAL,
  ownership,
  players,
  walkingPlayerIds,
  isSelected,
  selectionTone,
  isDimmed,
  onSelect,
}: BoardTileProps) {
  const tBoard = useTranslations('Board') as unknown as (key: string) => string;

  if (!space.corner) return null;

  const cornerColor = CORNER_COLOR_MAP[space.corner];
  const tileName    = tBoard(`tiles.${gameMode}.p${space.pos}`);

  return (
    <TileBase
      isSelected={isSelected}
      selectionTone={selectionTone}
      isDimmed={isDimmed}
      onSelect={onSelect}
      className="flex h-full w-full flex-col items-center justify-center rounded-[16px]"
      style={{
        backgroundColor: cornerColor,
        borderColor:     cornerColor,
        color:           BOARD_TILE_COLORS.altText,
        padding:         getTilePadding(),
        gap:             '0.3em',
        boxShadow:       TILE_SHADOW,
      }}
    >
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
      <BuildingsMarker ownership={ownership} edge={edge} />
      <PlayerMarker players={players} edge={edge} walkingPlayerIds={walkingPlayerIds} />
    </TileBase>
  );
}
