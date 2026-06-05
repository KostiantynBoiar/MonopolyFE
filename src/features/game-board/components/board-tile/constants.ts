import { SpaceType, TileEdge, CornerVariant, BoardTileSelectionTone } from '../../game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '../../game-board.colors';

export { BOARD_TILE_COLORS, GAME_BOARD_COLORS };

export const PROPERTY_HEADER_RATIO = 1.25;

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

// ─── Tile elevation / surface treatment ────────────────────────────────────────
// Layered warm-paper elevation, matching the dice/deed/button widgets — a tile
// reads like a printed chip resting on the board rather than a flat rectangle.
export const TILE_SHADOW =
  '0 1px 2px rgba(51,48,43,0.10), 0 3px 8px rgba(51,48,43,0.12)';

// Soft top-down sheen: a bright highlight along the top edge fading to a faint
// bottom shade. Sits beneath the content so labels stay crisp.
export const TILE_SHEEN =
  'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.07) 100%)';

// Subtle gloss line printed along the color band's leading edge.
export const TILE_BAND_GLOSS = 'inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 2px rgba(0,0,0,0.14)';

// Hover/press feedback for selectable tiles. Kept to brightness + a hair of
// scale so neighbours (2px gap) never visually collide.
export const TILE_INTERACTIVE =
  'transition-[transform,filter] duration-150 ease-out hover:brightness-[1.04] active:scale-[0.985]';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTilePadding() {
  return 'clamp(3px, 0.45vmin, 7px)';
}

export function getTileTextColor(type: SpaceType) {
  return type === SpaceType.RAILROAD || type === SpaceType.UTILITY || type === SpaceType.TAX
    ? BOARD_TILE_COLORS.altText
    : GAME_BOARD_COLORS.tileText;
}

export function isVerticalEdge(edge: TileEdge) {
  return edge === TileEdge.LEFT || edge === TileEdge.RIGHT;
}

export function getHeaderStyle(edge: TileEdge, color: string) {
  if (edge === TileEdge.LEFT || edge === TileEdge.RIGHT) {
    return { backgroundColor: color, width: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})` };
  }
  return { backgroundColor: color, height: `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})` };
}

export function getContentPadding(edge: TileEdge, hasHeader: boolean) {
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
  const bandH = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO})`;
  const bandV = `calc(var(--board-edge-depth) * ${PROPERTY_HEADER_RATIO * 2})`;

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

// For portrait (BOTTOM/TOP) tiles: split at the FIRST space so "вул." / "просп."
// / "Ст." lands on line 1 and the main name fills line 2.
export function splitAtFirst(name: string): [string, string | null] {
  const idx = name.indexOf(' ');
  if (idx === -1) return [name, null];
  return [name.slice(0, idx), name.slice(idx + 1)];
}
