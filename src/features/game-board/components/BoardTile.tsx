'use client';

import { BoardTileFlavor, CornerVariant, SpaceType, TileEdge } from '../game-board.enums';
import type { BoardTileProps } from '../game-board.types';
import {
  BOARD_TILE_COLORS,
  CORNER_COLOR_MAP,
  GAME_BOARD_COLORS,
  SPACE_SURFACE_MAP,
  SPACE_SYMBOL_MAP,
  getSpaceHeaderColor,
} from '../game-board.colors';
import { cn } from '@/shared/lib/cn';
import { BuildingsMarker } from './BuildingsMarker';
import { PlayerMarker } from './PlayerMarker';

const PROPERTY_HEADER_RATIO = 1.25;

// ─── Edge header position classes ────────────────────────────────────────────
const EDGE_HEADER: Record<TileEdge, string> = {
  [TileEdge.BOTTOM]: 'absolute inset-x-0 top-0 rounded-t-[10px]',
  [TileEdge.TOP]:    'absolute inset-x-0 bottom-0 rounded-b-[10px]',
  [TileEdge.LEFT]:   'absolute inset-y-0 right-0 rounded-r-[10px]',
  [TileEdge.RIGHT]:  'absolute inset-y-0 left-0 rounded-l-[10px]',
  [TileEdge.CORNER]: 'absolute inset-x-0 top-0 rounded-t-[10px]',
};

const CORNER_SYMBOL_MAP: Record<CornerVariant, string> = {
  [CornerVariant.GO]:        '🏁',
  [CornerVariant.JAIL]:      '🚓',
  [CornerVariant.PARKING]:   '🚗',
  [CornerVariant.GOTO_JAIL]: '🚨',
};

// ─── Font sizes (vmin, ~3× original) ─────────────────────────────────────────
// All text containers use overflow:hidden + break-all so text fills maximum
// space without ever causing layout overflow.
const cornerEmojiSize  = 'clamp(24px,  6.0vmin,  60px)';
const cornerNameSize   = 'clamp(11px,  2.1vmin,  28px)';
const cornerSubSize    = 'clamp(7px,   0.8vmin,  12px)';
const specialEmojiSize = 'clamp(18px,  4.2vmin,  50px)';
const specialNameSize  = 'clamp(9px,   1.5vmin,  21px)';
const specialPriceSize = 'clamp(7px,   1.1vmin,  16px)';
const propNameSize     = 'clamp(9px,   1.4vmin,  19px)';
const propPriceSize    = 'clamp(7px,   1.1vmin,  15px)';
const propSymbolSize   = 'clamp(16px,  3.2vmin,  48px)';

function getTilePadding() {
  return 'clamp(3px, 0.45vmin, 7px)';
}

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

// Returns padding that offsets the content away from the color-band header.
function getContentPadding(edge: TileEdge, hasHeader: boolean) {
  const base   = getTilePadding();
  const header = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`;
  const padded = `calc(${base} + ${header})`;

  if (!hasHeader) return { padding: base };

  switch (edge) {
    case TileEdge.BOTTOM:
      return { paddingTop: padded, paddingRight: base, paddingBottom: base, paddingLeft: base };
    case TileEdge.TOP:
      return { paddingTop: base, paddingRight: base, paddingBottom: padded, paddingLeft: base };
    case TileEdge.LEFT:
      return { paddingTop: base, paddingRight: padded, paddingBottom: base, paddingLeft: base };
    case TileEdge.RIGHT:
      return { paddingTop: base, paddingRight: base, paddingBottom: base, paddingLeft: padded };
    default:
      return { padding: base };
  }
}

// ─── Tile content: name + price ───────────────────────────────────────────────
// break-all ensures single long words (e.g. "MEDITERRANEAN") wrap mid-character
// rather than overflowing. overflow:hidden clips any excess height cleanly.

interface TileTextProps {
  name:       string;
  price?:     number | null;
  textColor:  string;
}

function TileText({ name, price, textColor }: TileTextProps) {
  return (
    <div className="min-w-0 overflow-hidden">
      <h3
        className="break-all font-display font-semibold uppercase leading-tight overflow-hidden"
        style={{ fontSize: propNameSize }}
      >
        {name}
      </h3>
      {price != null && (
        <p
          className="font-mono font-bold overflow-hidden whitespace-nowrap"
          style={{ fontSize: propPriceSize, color: textColor, opacity: 0.80 }}
        >
          ${price}
        </p>
      )}
    </div>
  );
}

// ─── BoardTile ────────────────────────────────────────────────────────────────

export function BoardTile({ space, edge, flavor, ownership, players }: BoardTileProps) {
  // ─── Corner ───────────────────────────────────────────────────────────────

  if (flavor === BoardTileFlavor.CORNER && space.corner) {
    const cornerColor = CORNER_COLOR_MAP[space.corner];

    return (
      <article
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[16px] border shadow-sm"
        style={{
          backgroundColor: cornerColor,
          borderColor:     cornerColor,
          color:           BOARD_TILE_COLORS.altText,
          padding:         getTilePadding(),
          gap:             '0.3em',
        }}
      >
        {/* Emoji fills as much space as possible; text below clips if needed */}
        <span className="shrink-0 leading-none" style={{ fontSize: cornerEmojiSize }}>
          {CORNER_SYMBOL_MAP[space.corner]}
        </span>
        <h3
          className="break-all text-center font-display font-black uppercase leading-tight overflow-hidden w-full"
          style={{ fontSize: cornerNameSize, color: BOARD_TILE_COLORS.altText }}
        >
          {space.name}
        </h3>
        {space.corner === CornerVariant.JAIL && (
          <p
            className="font-mono uppercase tracking-[0.18em] overflow-hidden whitespace-nowrap"
            style={{ fontSize: cornerSubSize, color: BOARD_TILE_COLORS.altText, opacity: 0.80 }}
          >
            Just visiting
          </p>
        )}
        <PlayerMarker players={players} edge={edge} />
      </article>
    );
  }

  // ─── Special (Chance, Chest, Tax, Railroad, Utility) ──────────────────────

  if (flavor === BoardTileFlavor.SPECIAL) {
    return (
      <article
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[12px] border text-center shadow-sm"
        style={{
          backgroundColor: SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.special,
          borderColor:     BOARD_TILE_COLORS.propertyOrange,
          color:           BOARD_TILE_COLORS.altText,
          padding:         getTilePadding(),
          gap:             '0.2em',
        }}
      >
        <span className="shrink-0 leading-none" style={{ fontSize: specialEmojiSize }}>
          {SPACE_SYMBOL_MAP[space.type]}
        </span>
        <div className="min-w-0 overflow-hidden w-full text-center">
          <h3
            className="break-all font-display font-bold uppercase leading-tight overflow-hidden"
            style={{ fontSize: specialNameSize }}
          >
            {space.name}
          </h3>
          {space.price != null && (
            <p
              className="font-mono font-semibold overflow-hidden whitespace-nowrap"
              style={{ fontSize: specialPriceSize, opacity: 0.85 }}
            >
              Pay ${space.price}
            </p>
          )}
        </div>
        <PlayerMarker players={players} edge={edge} />
      </article>
    );
  }

  // ─── Property / Railroad / Utility ────────────────────────────────────────

  const propertyColor = space.color ? getSpaceHeaderColor(space) : undefined;
  const symbol        = SPACE_SYMBOL_MAP[space.type];
  const surface       = SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.tile;
  const textColor     = getTileTextColor(space.type);
  const isVertical    = isVerticalEdge(edge);

  // Vertical (landscape) tiles: symbol sits beside the text in a row layout.
  // Horizontal (portrait) tiles: symbol stacks below the text.
  const layoutIsRow = isVertical && space.type !== SpaceType.PROPERTY && Boolean(symbol);
  const flexDir     = (() => {
    if (layoutIsRow) return 'flex-row items-center';
    if (edge === TileEdge.TOP) return 'flex-col-reverse justify-between';
    return 'flex-col justify-between';
  })();

  return (
    <article
      className="relative flex h-full w-full overflow-hidden rounded-[12px] border shadow-sm"
      style={{
        backgroundColor: surface,
        borderColor:     GAME_BOARD_COLORS.tileBorder,
        color:           textColor,
      }}
    >
      {propertyColor && (
        <div
          className={EDGE_HEADER[edge]}
          style={getHeaderStyle(edge, propertyColor)}
        />
      )}
      <BuildingsMarker ownership={ownership} edge={edge} />
      <PlayerMarker players={players} edge={edge} />

      {/* Content: text + optional symbol, inset from the color-band header */}
      <div
        className={cn('flex min-w-0 min-h-0 flex-1 overflow-hidden', flexDir)}
        style={getContentPadding(edge, !!propertyColor)}
      >
        {layoutIsRow ? (
          // Landscape tile with symbol: text takes remaining width, symbol fixed
          <>
            <div className="min-w-0 flex-1 overflow-hidden">
              <TileText name={space.name} price={space.price} textColor={textColor} />
            </div>
            {symbol && (
              <span
                className="shrink-0 leading-none ml-1"
                style={{
                  fontSize: propSymbolSize,
                  color:    BOARD_TILE_COLORS.altText,
                }}
              >
                {symbol}
              </span>
            )}
          </>
        ) : (
          // Portrait tile: text at top (or bottom for TOP edge), symbol below
          <>
            <TileText name={space.name} price={space.price} textColor={textColor} />
            {space.type !== SpaceType.PROPERTY && symbol && (
              <span
                className="shrink-0 leading-none self-end"
                style={{
                  fontSize: propSymbolSize,
                  color:    space.type === SpaceType.TAX
                    ? BOARD_TILE_COLORS.propertyRed
                    : BOARD_TILE_COLORS.altText,
                }}
              >
                {symbol}
              </span>
            )}
          </>
        )}
      </div>
    </article>
  );
}
