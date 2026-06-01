'use client';

import { BoardTileFlavor, CornerVariant, SpaceType, TileEdge } from '../game-board.enums';
import type { BoardTileProps } from '../game-board.types';
import { CORNER_COLOR_MAP, GAME_BOARD_COLORS, PROPERTY_COLOR_MAP, SPACE_SURFACE_MAP, SPACE_SYMBOL_MAP } from '../game-board.colors';
import { cn } from '@/shared/lib/cn';

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

function getHeaderStyle(edge: TileEdge, color: string) {
  if (edge === TileEdge.LEFT || edge === TileEdge.RIGHT) {
    return {
      backgroundColor: color,
      width: 'calc(var(--board-edge-depth) * 0.25)',
    };
  }

  return {
    backgroundColor: color,
    height: 'calc(var(--board-edge-depth) * 0.25)',
  };
}

function getTilePadding() {
  return 'clamp(4px, calc(var(--board-tile-width) * 0.16), 12px)';
}

function getContentPadding(edge: TileEdge, hasHeader: boolean) {
  const base = getTilePadding();
  const header = 'calc(var(--board-edge-depth) * 0.25)';
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
    return (
      <article
        className="flex h-full w-full flex-col items-center justify-center rounded-[16px] border shadow-sm text-center"
        style={{
          backgroundColor: GAME_BOARD_COLORS.tileSurface,
          borderColor: GAME_BOARD_COLORS.tileBorder,
          color: GAME_BOARD_COLORS.tileText,
          boxShadow: `0 10px 18px ${GAME_BOARD_COLORS.boardShadow}`,
          padding: getTilePadding(),
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-[12px] px-3 py-2"
          style={{ backgroundColor: CORNER_COLOR_MAP[space.corner] }}
        >
          <span
            className="leading-none"
            style={{
              fontSize: 'clamp(24px, calc(var(--board-corner-size) * 0.34), 48px)',
              color: GAME_BOARD_COLORS.boardCenterText,
            }}
          >
            {CORNER_SYMBOL_MAP[space.corner]}
          </span>
          <h3
            className="font-display font-semibold uppercase leading-tight"
            style={{
              fontSize: 'clamp(14px, calc(var(--board-corner-size) * 0.18), 24px)',
              color: GAME_BOARD_COLORS.boardCenterText,
            }}
          >
            {space.name}
          </h3>
          {space.corner === CornerVariant.JAIL && (
            <p
              className="uppercase tracking-[0.2em]"
              style={{
                color: GAME_BOARD_COLORS.playerPanelMuted,
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
        className="flex h-full w-full flex-col items-start justify-between rounded-[12px] border shadow-sm"
        style={{
          backgroundColor: SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.specialSurface,
          borderColor: GAME_BOARD_COLORS.specialBorder,
          color: GAME_BOARD_COLORS.tileText,
          boxShadow: `0 8px 14px ${GAME_BOARD_COLORS.boardShadow}`,
          padding: getTilePadding(),
        }}
      >
        <span
          className="leading-none"
          style={{ fontSize: 'clamp(18px, calc(var(--board-tile-width) * 0.34), 28px)' }}
        >
          {SPACE_SYMBOL_MAP[space.type]}
        </span>
        <div>
          <h3
            className="font-display font-semibold uppercase leading-tight"
            style={{ fontSize: 'clamp(10px, calc(var(--board-tile-width) * 0.18), 14px)' }}
          >
            {space.name}
          </h3>
          {space.price != null && (
            <p
              className="mt-1 font-medium"
              style={{
                color: GAME_BOARD_COLORS.priceText,
                fontSize: 'clamp(9px, calc(var(--board-tile-width) * 0.16), 12px)',
              }}
            >
              Pay ${space.price}
            </p>
          )}
        </div>
      </article>
    );
  }

  const propertyColor = space.color ? PROPERTY_COLOR_MAP[space.color] : undefined;
  const symbol = SPACE_SYMBOL_MAP[space.type];
  const surface = SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.tileSurface;

  return (
    <article
      className={cn(
        'relative flex h-full w-full overflow-hidden rounded-[12px] border shadow-sm',
      )}
      style={{
        backgroundColor: surface,
        borderColor: GAME_BOARD_COLORS.tileBorder,
        color: GAME_BOARD_COLORS.tileText,
        boxShadow: `0 8px 14px ${GAME_BOARD_COLORS.boardShadow}`,
      }}
    >
      {propertyColor && (
        <div
          className={EDGE_HEADER[edge]}
          style={getHeaderStyle(edge, propertyColor)}
        />
      )}
      <div
        className={cn('flex min-w-0 flex-1 justify-between', EDGE_CONTENT[edge])}
        style={getContentPadding(edge, !!propertyColor)}
      >
        <div className="min-w-0">
          <h3
            className="font-display font-semibold uppercase leading-tight"
            style={{ fontSize: 'clamp(9px, calc(var(--board-tile-width) * 0.16), 12px)' }}
          >
            {space.name}
          </h3>
          {space.price != null && (
            <p
              className="mt-1 font-medium"
              style={{
                color: GAME_BOARD_COLORS.priceText,
                fontSize: 'clamp(8px, calc(var(--board-tile-width) * 0.14), 11px)',
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
              fontSize: 'clamp(14px, calc(var(--board-tile-width) * 0.28), 22px)',
              color:
                space.type === SpaceType.TAX
                  ? GAME_BOARD_COLORS.symbolTax
                  : space.type === SpaceType.UTILITY
                    ? GAME_BOARD_COLORS.symbolUtility
                    : GAME_BOARD_COLORS.symbolRailroad,
            }}
          >
            {symbol}
          </span>
        )}
      </div>
    </article>
  );
}
