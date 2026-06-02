'use client';

import { BoardTileFlavor, CornerVariant, SpaceType, TileEdge } from '../game-board.enums';
import type { BoardTileProps } from '../game-board.types';
import { BOARD_TILE_COLORS, CORNER_COLOR_MAP, GAME_BOARD_COLORS, SPACE_SURFACE_MAP, SPACE_SYMBOL_MAP, getSpaceHeaderColor } from '../game-board.colors';
import { cn } from '@/shared/lib/cn';

const PROPERTY_HEADER_RATIO = 1.25;

const EDGE_CONTENT: Record<TileEdge, string> = {
  [TileEdge.BOTTOM]: 'flex-col',
  [TileEdge.TOP]: 'flex-col-reverse',
  [TileEdge.LEFT]: 'h-full flex-1 flex-col items-start justify-between',
  [TileEdge.RIGHT]: 'h-full flex-1 flex-col items-start justify-between',
  [TileEdge.CORNER]: 'flex-col',
};

const EDGE_HEADER: Record<TileEdge, string> = {
  [TileEdge.BOTTOM]: 'absolute inset-x-0 top-0 rounded-t-[10px]',
  [TileEdge.TOP]: 'absolute inset-x-0 bottom-0 rounded-b-[10px]',
  [TileEdge.LEFT]: 'absolute inset-y-0 right-0 rounded-r-[10px]',
  [TileEdge.RIGHT]: 'absolute inset-y-0 left-0 rounded-l-[10px]',
  [TileEdge.CORNER]: 'absolute inset-x-0 top-0 rounded-t-[10px]',
};

const CORNER_SYMBOL_MAP: Record<CornerVariant, string> = {
  [CornerVariant.GO]: '🏁',
  [CornerVariant.JAIL]: '🚓',
  [CornerVariant.PARKING]: '🚗',
  [CornerVariant.GOTO_JAIL]: '🚨',
};

function getTileTextColor(type: SpaceType) {
  return type === SpaceType.RAILROAD || type === SpaceType.UTILITY || type === SpaceType.TAX
    ? BOARD_TILE_COLORS.altText
    : GAME_BOARD_COLORS.tileText;
}

function isVerticalEdge(edge: TileEdge) {
  return edge === TileEdge.LEFT || edge === TileEdge.RIGHT;
}

function getHeaderStyle(edge: TileEdge, color: string) {
  if (edge === TileEdge.LEFT || edge === TileEdge.RIGHT) {
    return {
      backgroundColor: color,
      width: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`,
    };
  }

  return {
    backgroundColor: color,
    height: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`,
  };
}

function getTilePadding() {
  return 'clamp(4px, calc(var(--board-tile-width) * 0.16), 12px)';
}

function getContentPadding(edge: TileEdge, hasHeader: boolean) {
  const base = getTilePadding();
  const header = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`;
  const padded = `calc(${base} + ${header})`;

  if (!hasHeader) {
    return { padding: base };
  }

  switch (edge) {
    case TileEdge.BOTTOM:
      return {
        paddingTop: padded,
        paddingRight: base,
        paddingBottom: base,
        paddingLeft: base,
      };
    case TileEdge.TOP:
      return {
        paddingTop: base,
        paddingRight: base,
        paddingBottom: padded,
        paddingLeft: base,
      };
    case TileEdge.LEFT:
      return {
        paddingTop: base,
        paddingRight: padded,
        paddingBottom: base,
        paddingLeft: base,
      };
    case TileEdge.RIGHT:
      return {
        paddingTop: base,
        paddingRight: base,
        paddingBottom: base,
        paddingLeft: padded,
      };
    default:
      return { padding: base };
  }
}

export function BoardTile({ space, edge, flavor }: BoardTileProps) {
  if (flavor === BoardTileFlavor.CORNER && space.corner) {
    const cornerColor = CORNER_COLOR_MAP[space.corner];

    return (
      <article
        className="flex h-full w-full flex-col items-center justify-center rounded-[16px] border shadow-sm text-center"
        style={{
          backgroundColor: cornerColor,
          borderColor: cornerColor,
          color: BOARD_TILE_COLORS.altText,
          padding: getTilePadding(),
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-2 px-3 py-2"
        >
          <span
            className="leading-none"
            style={{
              fontSize: 'clamp(48px, calc(var(--board-corner-size) * 0.68), 96px)',
              color: BOARD_TILE_COLORS.altText,
            }}
          >
            {CORNER_SYMBOL_MAP[space.corner]}
          </span>
          <h3
            className="font-display font-semibold uppercase leading-tight"
            style={{
              fontSize: 'clamp(14px, calc(var(--board-corner-size) * 0.18), 24px)',
              color: BOARD_TILE_COLORS.altText,
            }}
          >
            {space.name}
          </h3>
          {space.corner === CornerVariant.JAIL && (
            <p
              className="uppercase tracking-[0.2em]"
              style={{
                color: BOARD_TILE_COLORS.altText,
                fontSize: 'clamp(9px, calc(var(--board-tile-width) * 0.16), 12px)',
              }}
            >
              Just visiting
            </p>
          )}
        </div>
      </article>
    );
  }

  if (flavor === BoardTileFlavor.SPECIAL) {
    return (
      <article
        className="flex h-full w-full flex-col items-center justify-center rounded-[12px] border text-center shadow-sm"
        style={{
          backgroundColor: SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.special,
          borderColor: BOARD_TILE_COLORS.propertyOrange,
          color: BOARD_TILE_COLORS.altText,
          padding: getTilePadding(),
        }}
      >
        <span
          className="leading-none"
          style={{ fontSize: 'clamp(36px, calc(var(--board-tile-width) * 0.68), 56px)' }}
        >
          {SPACE_SYMBOL_MAP[space.type]}
        </span>
        <div className="mt-1 min-w-0 px-1 py-1 text-center">
          <h3
            className="break-words font-display font-bold uppercase leading-[1.05]"
            style={{ fontSize: 'clamp(12px, calc(var(--board-tile-width) * 0.23), 17px)' }}
          >
            {space.name}
          </h3>
          {space.price != null && (
            <p
              className="mt-1 font-extrabold"
              style={{
                color: BOARD_TILE_COLORS.altText,
                fontSize: 'clamp(10px, calc(var(--board-tile-width) * 0.18), 13px)',
              }}
            >
              Pay ${space.price}
            </p>
          )}
        </div>
      </article>
    );
  }

  const propertyColor = space.color ? getSpaceHeaderColor(space) : undefined;
  const symbol = SPACE_SYMBOL_MAP[space.type];
  const surface = SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.tile;
  const textColor = getTileTextColor(space.type);
  const isVertical = isVerticalEdge(edge);
  const hasSideSymbol = isVertical && space.type !== SpaceType.PROPERTY && Boolean(symbol);

  return (
    <article
      className={cn(
        'relative flex h-full w-full overflow-hidden rounded-[12px] border shadow-sm',
      )}
      style={{
        backgroundColor: surface,
        borderColor: GAME_BOARD_COLORS.tileBorder,
        color: textColor,
      }}
    >
      {propertyColor && (
        <div
          className={EDGE_HEADER[edge]}
          style={getHeaderStyle(edge, propertyColor)}
        />
      )}
      <div
        className={cn(
          'flex min-w-0 flex-1 justify-between',
          EDGE_CONTENT[edge],
          hasSideSymbol && 'flex-row items-center',
        )}
        style={getContentPadding(edge, !!propertyColor)}
      >
        <div className={cn('min-w-0 px-1 py-1', edge === TileEdge.BOTTOM && 'translate-y-[3px]')}>
          <h3
            className="break-words font-display font-bold uppercase leading-[1.05]"
            style={{ fontSize: 'clamp(11px, calc(var(--board-tile-width) * 0.21), 15px)' }}
          >
            {space.name}
          </h3>
          {space.price != null && (
            <p
              className="mt-1 font-extrabold"
              style={{
                color: textColor,
                fontSize: 'clamp(10px, calc(var(--board-tile-width) * 0.17), 13px)',
              }}
            >
              ${space.price}
            </p>
          )}
        </div>

        {space.type !== SpaceType.PROPERTY && symbol && (
          <span
            className="shrink-0 leading-none"
            style={{
              fontSize: 'clamp(28px, calc(var(--board-tile-width) * 0.56), 44px)',
              color:
                space.type === SpaceType.TAX
                  ? BOARD_TILE_COLORS.propertyRed
                  : space.type === SpaceType.UTILITY
                    ? BOARD_TILE_COLORS.altText
                    : BOARD_TILE_COLORS.altText,
            }}
          >
            {symbol}
          </span>
        )}
      </div>
    </article>
  );
}
