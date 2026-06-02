export { BoardTileFlavor, PropertyColor, SpaceType, TileEdge } from './game-board.enums';
export type { BoardSpace, BoardPlayer, WalkingPlayer } from './game-board.types';
export { BOARD, getGridPos, getTileEdge, getWalkSteps, getTileCenter } from '@/shared/config/board-layout';
export { BoardContainer } from './components/BoardContainer';
export { BoardTile } from './components/BoardTile';
export { deriveBoardPlayers, deriveSidebarPlayers } from './game-board.adapters';
export { GAME_BOARD_COLORS, BOARD_TILE_COLORS, PROPERTY_COLOR_MAP } from './game-board.colors';
export { useActionButtons } from './hooks';
export type { OverlayId } from './hooks';
