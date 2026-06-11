import { SpaceType } from '@/features/game-board/game-board.enums';
import { BOARD_TILE_COLORS } from './boardTile.colors';
import { BoardTileSelectionTone, CornerVariant, TileEdge } from './boardTile.enums';

// ─── Font sizes ───────────────────────────────────────────────────────────────

export const cornerEmojiSize  = 'clamp(24px,  6.0vmin,  60px)';
export const cornerNameSize   = 'clamp(11px,  2.1vmin,  28px)';
export const cornerSubSize    = 'clamp(7px,   0.8vmin,  12px)';
export const specialEmojiSize = 'clamp(18px,  4.2vmin,  50px)';
export const specialNameSize  = 'clamp(9px,   1.5vmin,  21px)';
export const specialPriceSize = 'clamp(7px,   1.1vmin,  16px)';
export const propNameSize     = 'clamp(9px,   1.4vmin,  19px)';
export const propPriceSize    = 'clamp(9px,   1.5vmin,  20px)';
export const propSymbolSize   = 'clamp(16px,  3.2vmin,  48px)';

// ─── Text shadows ─────────────────────────────────────────────────────────────

export const shadowOnColor = '0 1px 3px rgba(0,0,0,0.35)';
export const shadowOnLight = '0 0.5px 2px rgba(0,0,0,0.18)';
export const shadowEmoji   = '0 2px 6px rgba(0,0,0,0.40)';

// ─── Tile surface treatment ───────────────────────────────────────────────────

export const TILE_SHADOW =
  '0 1px 2px rgba(51,48,43,0.10), 0 3px 8px rgba(51,48,43,0.12)';

// Glossy top-light overlay. Sits beneath content so labels stay crisp.
export const TILE_SHEEN =
  'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.07) 100%)';

// Subtle gloss line along the color band's leading edge.
export const TILE_BAND_GLOSS =
  'inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 2px rgba(0,0,0,0.14)';

// Hover/press feedback for selectable tiles.
export const TILE_INTERACTIVE =
  'transition-[transform,filter] duration-150 ease-out hover:brightness-[1.04] active:scale-[0.985]';

// ─── Layout maps ─────────────────────────────────────────────────────────────

export const EDGE_HEADER: Record<TileEdge, string> = {
  [TileEdge.BOTTOM]: 'absolute inset-x-0 top-0 rounded-t-[10px]',
  [TileEdge.TOP]:    'absolute inset-x-0 bottom-0 rounded-b-[10px]',
  [TileEdge.LEFT]:   'absolute inset-y-0 right-0 rounded-r-[10px]',
  [TileEdge.RIGHT]:  'absolute inset-y-0 left-0 rounded-l-[10px]',
  [TileEdge.CORNER]: 'absolute inset-x-0 top-0 rounded-t-[10px]',
};

export const CORNER_SYMBOL_MAP: Record<CornerVariant, string> = {
  [CornerVariant.GO]:        '🏁',
  [CornerVariant.JAIL]:      '🚓',
  [CornerVariant.PARKING]:   '🚗',
  [CornerVariant.GOTO_JAIL]: '🚨',
};

export const SELECTION_RING_COLOR: Record<BoardTileSelectionTone, string> = {
  [BoardTileSelectionTone.TRADE_OFFER]:   BOARD_TILE_COLORS.propertyGreen,
  [BoardTileSelectionTone.TRADE_REQUEST]: BOARD_TILE_COLORS.propertyCyan,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const PROPERTY_HEADER_RATIO = 1.25;

export function getTilePadding(): string {
  return 'clamp(3px, 0.45vmin, 7px)';
}

export function getTileTextColor(type: SpaceType): string {
  return type === SpaceType.RAILROAD || type === SpaceType.UTILITY || type === SpaceType.TAX
    ? BOARD_TILE_COLORS.altText
    : 'var(--board-tile-text)';
}

export function isVerticalEdge(edge: TileEdge): boolean {
  return edge === TileEdge.LEFT || edge === TileEdge.RIGHT;
}

export function getHeaderStyle(edge: TileEdge, color: string): React.CSSProperties {
  if (edge === TileEdge.LEFT || edge === TileEdge.RIGHT) {
    return { backgroundColor: color, width: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})` };
  }
  return { backgroundColor: color, height: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})` };
}

export function getContentPadding(edge: TileEdge, hasHeader: boolean): React.CSSProperties {
  const base = getTilePadding();

  // CSS percentage resolution quirk:
  //
  // LEFT/RIGHT tiles are landscape (2u wide × 1u tall).
  // The absolute color band uses  width: %  → 100% = tile WIDTH = 2u  ✓
  // The flex content uses padding-right: % → 100% = tile WIDTH = 2u  ✓
  //
  // BOTTOM/TOP tiles are portrait (1u wide × 2u tall).
  // The absolute color band uses  height: % → 100% = tile HEIGHT = 2u
  // The flex content uses padding-top: %   → 100% = tile WIDTH  = 1u  ✗ (2× off)
  //
  // To match band depth, the BOTTOM/TOP coefficient must be doubled.
  const bandH = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`;
  const bandV = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO * 2})`;

  if (!hasHeader) return { padding: base };

  switch (edge) {
    case TileEdge.BOTTOM: return { paddingTop: `calc(${base} + ${bandV})`, paddingRight: base, paddingBottom: base, paddingLeft: base };
    case TileEdge.TOP:    return { paddingTop: base, paddingRight: base, paddingBottom: `calc(${base} + ${bandV})`, paddingLeft: base };
    case TileEdge.LEFT:   return { paddingTop: base, paddingRight: `calc(${base} + ${bandH})`, paddingBottom: base, paddingLeft: base };
    case TileEdge.RIGHT:  return { paddingTop: base, paddingRight: base, paddingBottom: base, paddingLeft: `calc(${base} + ${bandH})` };
    default:              return { padding: base };
  }
}

// Splits at the first space so "вул." / "просп." lands on line 1,
// main name fills line 2.
export function splitAtFirst(name: string): [string, string | null] {
  const idx = name.indexOf(' ');
  if (idx === -1) return [name, null];
  return [name.slice(0, idx), name.slice(idx + 1)];
}
