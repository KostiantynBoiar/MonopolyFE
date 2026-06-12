'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import {
  BOARD_TILE_COLORS,
  getSpaceHeaderColor,
  SPACE_SURFACE_MAP,
} from '../boardTile.colors';
import {
  EDGE_HEADER,
  getContentPadding,
  getHeaderStyle,
  getTileTextColor,
  isVerticalEdge,
  propSymbolSize,
  shadowOnColor,
  shadowOnLight,
  TILE_BAND_GLOSS,
  TILE_SHADOW,
} from '../boardTile.constants';
import { TileEdge } from '../boardTile.enums';
import { SpaceType } from '@/features/game-board/game-board.enums';
import { SPACE_SYMBOL_MAP } from '../boardTile.colors';
import type { BoardTileProps } from '../boardTile.schema';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { BuildingsMarker } from './BuildingsMarker';
import { MortgageOverlay, OwnershipOverlay } from './Overlays';
import { PlayerMarker } from './PlayerMarker';
import { TileBase } from './TileBase';
import { TileText } from './TileText';

export function PropertyTile({
  space,
  edge,
  gameMode = GameMode.NORMAL,
  ownership,
  ownerColor,
  players,
  walkingPlayerIds,
  isSelected,
  selectionTone,
  isDimmed,
  onSelect,
}: BoardTileProps) {
  const tBoard   = useTranslations('Board') as unknown as (key: string) => string;
  const tileName = tBoard(`tiles.${gameMode}.p${space.pos}`);

  const propertyColor = space.color ? getSpaceHeaderColor(space) : undefined;
  const symbol        = SPACE_SYMBOL_MAP[space.type];
  const surface       = SPACE_SURFACE_MAP[space.type] ?? 'var(--board-tile)';
  const textColor     = getTileTextColor(space.type);
  const isVertical    = isVerticalEdge(edge);
  const isHorizontal  = edge === TileEdge.BOTTOM || edge === TileEdge.TOP;
  const layoutIsRow   = isVertical && space.type !== SpaceType.PROPERTY && Boolean(symbol);

  const flexDir = layoutIsRow
    ? 'flex-row items-center'
    : edge === TileEdge.TOP
      ? 'flex-col-reverse justify-between'
      : isVertical
        ? 'flex-col justify-center'
        : 'flex-col justify-between';

  return (
    <TileBase
      isSelected={isSelected}
      selectionTone={selectionTone}
      isDimmed={isDimmed}
      onSelect={onSelect}
      className="flex h-full w-full rounded-[12px]"
      style={{
        backgroundColor: surface,
        borderColor:     'var(--board-tile-border)',
        color:           textColor,
        boxShadow:       TILE_SHADOW,
      }}
    >
      {propertyColor && (
        <div
          className={cn(EDGE_HEADER[edge], 'z-[45]')}
          style={{ ...getHeaderStyle(edge, propertyColor), boxShadow: TILE_BAND_GLOSS }}
        />
      )}
      {ownerColor && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[12px]"
          style={{ border: `2.5px solid ${ownerColor}`, zIndex: 15 }}
        />
      )}
      <BuildingsMarker ownership={ownership} edge={edge} />
      <PlayerMarker players={players} edge={edge} walkingPlayerIds={walkingPlayerIds} />

      <div
        className={cn('relative z-[45] flex min-w-0 min-h-0 flex-1 overflow-hidden', flexDir)}
        style={getContentPadding(edge, !!propertyColor)}
      >
        {layoutIsRow ? (
          <>
            <div className="min-w-0 flex-1 overflow-hidden text-center">
              <TileText name={tileName} price={space.price} textColor={textColor} doSplit={false} />
            </div>
            {symbol && (
              <span
                className="shrink-0 leading-none ml-1"
                style={{ fontSize: propSymbolSize, color: BOARD_TILE_COLORS.altText, textShadow: shadowOnColor }}
              >
                {symbol}
              </span>
            )}
          </>
        ) : (
          <>
            <TileText name={tileName} price={space.price} textColor={textColor} doSplit={isHorizontal} />
            {space.type !== SpaceType.PROPERTY && symbol && (
              <span
                className="shrink-0 leading-none self-end"
                style={{
                  fontSize:   propSymbolSize,
                  color:      space.type === SpaceType.TAX ? BOARD_TILE_COLORS.propertyRed : BOARD_TILE_COLORS.altText,
                  textShadow: space.type === SpaceType.TAX ? shadowOnLight : shadowOnColor,
                }}
              >
                {symbol}
              </span>
            )}
          </>
        )}
      </div>

      {ownerColor && <OwnershipOverlay color={ownerColor} isMortgaged={ownership?.isMortgaged ?? false} />}
      {ownership?.isMortgaged && <MortgageOverlay />}
    </TileBase>
  );
}
