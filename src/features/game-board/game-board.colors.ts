// Re-exported for consumers that still import from this path.
export {
  BOARD_TILE_COLORS,
  CORNER_COLOR_MAP,
  PROPERTY_COLOR_MAP,
  SPACE_SYMBOL_MAP,
  SPACE_SURFACE_MAP,
  getSpaceHeaderColor,
} from '@/features/board-tile/boardTile.colors';

export const GAME_BOARD_COLORS = {
  ink:       'var(--board-ink)',
  center:    'var(--board-center)',
  panel:     'var(--board-panel)',
  surface:   'var(--board-surface)',
  border:    'var(--board-border)',
  muted:     'var(--board-muted)',
  text:      'var(--board-text)',
  tile:      'var(--board-tile)',
  tileBorder:'var(--board-tile-border)',
  tileText:  'var(--board-tile-text)',
  special:   'var(--board-special)',
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSpaceHeaderTextColor(_space?: unknown): string {
  return 'var(--prop-alt-text)';
}
