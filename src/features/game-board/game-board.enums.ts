export { PropertyColor } from '@/shared/protocol/game-state.enums';

// Re-exported for backward compatibility with shared/config/board-layout and
// other consumers that still import from this path.
export { BoardTileFlavor, BoardTileSelectionTone, CornerVariant, TileEdge } from '@/features/board-tile/boardTile.enums';

export enum SpaceType {
  CORNER = 'corner',
  PROPERTY = 'property',
  RAILROAD = 'railroad',
  UTILITY = 'utility',
  CHANCE = 'chance',
  CHEST = 'chest',
  TAX = 'tax',
}
