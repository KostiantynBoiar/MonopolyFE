'use client';

import type { KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
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

// ─── Font sizes (vmin-based) ──────────────────────────────────────────────────
const cornerEmojiSize  = 'clamp(24px,  6.0vmin,  60px)';
const cornerNameSize   = 'clamp(11px,  2.1vmin,  28px)';
const cornerSubSize    = 'clamp(7px,   0.8vmin,  12px)';
const specialEmojiSize = 'clamp(18px,  4.2vmin,  50px)';
const specialNameSize  = 'clamp(9px,   1.5vmin,  21px)';
const specialPriceSize = 'clamp(7px,   1.1vmin,  16px)';
const propNameSize     = 'clamp(9px,   1.4vmin,  19px)';
const propPriceSize    = 'clamp(9px,   1.5vmin,  20px)';
const propSymbolSize   = 'clamp(16px,  3.2vmin,  48px)';

// ─── Text shadows ─────────────────────────────────────────────────────────────
const shadowOnColor = '0 1px 3px rgba(0,0,0,0.35)';
const shadowOnLight = '0 0.5px 2px rgba(0,0,0,0.18)';
const shadowEmoji   = '0 2px 6px rgba(0,0,0,0.40)';

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
    return { backgroundColor: color, width: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})` };
  }
  return { backgroundColor: color, height: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})` };
}

function getContentPadding(edge: TileEdge, hasHeader: boolean) {
  const base = getTilePadding();

  // CSS percentage resolution quirk:
  //
  // LEFT/RIGHT tiles are landscape (2u wide × 1u tall).
  // The absolute color band uses  width: %  → 100% = tile WIDTH = 2u  ✓
  // The flex content uses padding-right: % → 100% = tile WIDTH = 2u  ✓  (match)
  //
  // BOTTOM/TOP tiles are portrait (1u wide × 2u tall).
  // The absolute color band uses  height: % → 100% = tile HEIGHT = 2u
  // The flex content uses padding-top: %   → 100% = tile WIDTH  = 1u  ✗  (2× off)
  //
  // To make the content padding match the real band depth, the BOTTOM/TOP
  // coefficient must be doubled to compensate for the height:width = 2:1 ratio.
  const bandH = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`;       // for LEFT/RIGHT (width-based, correct)
  const bandV = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO * 2})`;   // for BOTTOM/TOP (width-based but band is height-based)

  if (!hasHeader) return { padding: base };

  switch (edge) {
    case TileEdge.BOTTOM:
      return { paddingTop: `calc(${base} + ${bandV})`, paddingRight: base, paddingBottom: base, paddingLeft: base };
    case TileEdge.TOP:
      return { paddingTop: base, paddingRight: base, paddingBottom: `calc(${base} + ${bandV})`, paddingLeft: base };
    case TileEdge.LEFT:
      return { paddingTop: base, paddingRight: `calc(${base} + ${bandH})`, paddingBottom: base, paddingLeft: base };
    case TileEdge.RIGHT:
      return { paddingTop: base, paddingRight: base, paddingBottom: base, paddingLeft: `calc(${base} + ${bandH})` };
    default:
      return { padding: base };
  }
}

// ─── Name split ───────────────────────────────────────────────────────────────
// For portrait (BOTTOM/TOP) tiles: split at the FIRST space so "вул." / "просп."
// / "Ст." lands on line 1 and the main name fills line 2, matching how physical
// Monopoly boards print tile names.
function splitAtFirst(name: string): [string, string | null] {
  const idx = name.indexOf(' ');
  if (idx === -1) return [name, null];
  return [name.slice(0, idx), name.slice(idx + 1)];
}

function SelectionRing({ selected }: { selected: boolean }) {
  if (!selected) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30"
      style={{
        borderRadius: 'inherit',
        boxShadow: `inset 0 0 0 clamp(2px, 0.45vmin, 5px) ${BOARD_TILE_COLORS.propertyYellow}, 0 0 0 1px rgba(16,24,46,0.55)`,
      }}
    />
  );
}

// ─── TileText ─────────────────────────────────────────────────────────────────

interface TileTextProps {
  name:       string;
  price?:     number | null;
  textColor:  string;
  doSplit:    boolean;
}

function TileText({ name, price, textColor, doSplit }: TileTextProps) {
  const [line1, line2] = doSplit ? splitAtFirst(name) : [name, null];
  const shadow = shadowOnLight;

  return (
    <div className="min-w-0 overflow-hidden text-center">
      {doSplit && line2 ? (
        <>
          <p
            className="font-sans font-semibold uppercase leading-tight overflow-hidden whitespace-nowrap"
            style={{ fontSize: propNameSize, textShadow: shadow }}
          >
            {line1}
          </p>
          <p
            className="break-all font-sans font-black uppercase leading-tight overflow-hidden"
            style={{ fontSize: propNameSize, textShadow: shadow }}
          >
            {line2}
          </p>
        </>
      ) : (
        <h3
          className="break-all font-sans font-semibold uppercase leading-tight overflow-hidden"
          style={{ fontSize: propNameSize, textShadow: shadow }}
        >
          {name}
        </h3>
      )}
      {price != null && (
        <p
          className="font-sans font-black overflow-hidden whitespace-nowrap"
          style={{ fontSize: propPriceSize, color: textColor, opacity: 0.90, textShadow: shadow }}
        >
          ${price}
        </p>
      )}
    </div>
  );
}

// ─── BoardTile ────────────────────────────────────────────────────────────────

function OwnershipOverlay({ color, isMortgaged }: { color: string; isMortgaged: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        borderRadius: 'inherit',
        backgroundColor: color,
        opacity: isMortgaged ? 0.22 : 0.30,
      }}
    />
  );
}

function DimOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-300"
      style={{ borderRadius: 'inherit', backgroundColor: 'rgba(0,0,0,0.55)' }}
    />
  );
}

export function BoardTile({
  space,
  edge,
  flavor,
  ownership,
  ownerColor,
  players,
  walkingPlayerIds,
  isSelected = false,
  isDimmed = false,
  onSelect,
}: BoardTileProps) {
  // Dynamic key lookup for board position — eslint-disable-next-line needed
  // because next-intl's type system only accepts literal string keys.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tBoard    = useTranslations('Board') as unknown as (key: string) => string;
  const tileName  = tBoard(`tiles.p${space.pos}`);
  const justVisit = tBoard('justVisiting');

  const isHorizontal = edge === TileEdge.BOTTOM || edge === TileEdge.TOP;
  const isSelectable = Boolean(onSelect);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    onSelect();
  };
  const selectableProps = {
    role: isSelectable ? 'button' : undefined,
    tabIndex: isSelectable ? 0 : undefined,
    'aria-pressed': isSelectable ? isSelected : undefined,
    onClick: onSelect,
    onKeyDown: handleKeyDown,
  };

  // ─── Corner ───────────────────────────────────────────────────────────────

  if (flavor === BoardTileFlavor.CORNER && space.corner) {
    const cornerColor = CORNER_COLOR_MAP[space.corner];

    return (
      <article
        {...selectableProps}
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[16px] border shadow-sm',
          isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        )}
        style={{
          backgroundColor: cornerColor,
          borderColor:     cornerColor,
          color:           BOARD_TILE_COLORS.altText,
          padding:         getTilePadding(),
          gap:             '0.3em',
        }}
      >
        <span
          className="shrink-0 leading-none"
          style={{ fontSize: cornerEmojiSize, textShadow: shadowEmoji }}
        >
          {CORNER_SYMBOL_MAP[space.corner]}
        </span>
        <h3
          className="break-all text-center font-sans font-black uppercase leading-tight overflow-hidden w-full"
          style={{ fontSize: cornerNameSize, color: BOARD_TILE_COLORS.altText, textShadow: shadowOnColor }}
        >
          {tileName}
        </h3>
        {space.corner === CornerVariant.JAIL && (
          <p
            className="font-sans uppercase tracking-[0.18em] overflow-hidden whitespace-nowrap"
            style={{ fontSize: cornerSubSize, color: BOARD_TILE_COLORS.altText, opacity: 0.80, textShadow: shadowOnColor }}
          >
            {justVisit}
          </p>
        )}
        <PlayerMarker players={players} edge={edge} walkingPlayerIds={walkingPlayerIds} />
        {isDimmed && <DimOverlay />}
        <SelectionRing selected={isSelected} />
      </article>
    );
  }

  // ─── Special ──────────────────────────────────────────────────────────────

  if (flavor === BoardTileFlavor.SPECIAL) {
    return (
      <article
        {...selectableProps}
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[12px] border text-center shadow-sm',
          isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        )}
        style={{
          backgroundColor: SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.special,
          borderColor:     BOARD_TILE_COLORS.propertyOrange,
          color:           BOARD_TILE_COLORS.altText,
          padding:         getTilePadding(),
          gap:             '0.2em',
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
        {ownerColor && <OwnershipOverlay color={ownerColor} isMortgaged={ownership?.isMortgaged ?? false} />}
        {isDimmed && <DimOverlay />}
        <SelectionRing selected={isSelected} />
      </article>
    );
  }

  // ─── Property / Railroad / Utility ────────────────────────────────────────

  const propertyColor = space.color ? getSpaceHeaderColor(space) : undefined;
  const symbol        = SPACE_SYMBOL_MAP[space.type];
  const surface       = SPACE_SURFACE_MAP[space.type] ?? GAME_BOARD_COLORS.tile;
  const textColor     = getTileTextColor(space.type);
  const isVertical    = isVerticalEdge(edge);
  const layoutIsRow   = isVertical && space.type !== SpaceType.PROPERTY && Boolean(symbol);

  const flexDir = layoutIsRow
    ? 'flex-row items-center'
    : edge === TileEdge.TOP
      ? 'flex-col-reverse justify-between'
      : isVertical
        ? 'flex-col justify-center'   // single child on landscape tile — center it
        : 'flex-col justify-between';

  return (
    <article
      {...selectableProps}
      className={cn(
        'relative flex h-full w-full overflow-hidden rounded-[12px] border shadow-sm',
        isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
      )}
      style={{
        backgroundColor: surface,
        borderColor:     GAME_BOARD_COLORS.tileBorder,
        color:           textColor,
      }}
    >
      {propertyColor && (
        <div className={cn(EDGE_HEADER[edge], 'z-[45]')} style={getHeaderStyle(edge, propertyColor)} />
      )}
      <BuildingsMarker ownership={ownership} edge={edge} />
      <PlayerMarker players={players} edge={edge} />

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
            <TileText
              name={tileName}
              price={space.price}
              textColor={textColor}
              doSplit={isHorizontal}
            />
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
      {isDimmed && <DimOverlay />}
      <SelectionRing selected={isSelected} />
    </article>
  );
}
