import type { PropertyState } from '@/shared/protocol/game-state';
import type { GameMode, PropertyColor } from '@/shared/protocol/game-state.enums';
import type { BoardTileFlavor, BoardTileSelectionTone, CornerVariant, TileEdge } from './boardTile.enums';
import type { TokenShape } from './token-shapes';
import type { SpaceType } from '@/features/game-board/game-board.enums';

export interface BoardSpace {
  pos: number;
  type: SpaceType;
  price?: number;
  color?: PropertyColor;
  corner?: CornerVariant;
}

export interface BoardPlayer {
  id: string;
  position: number;
  tokenColor: string;
  tokenShape: TokenShape;
  isBankrupt: boolean;
  inJail?: boolean;
  avatarUrl?: string | null;
}

export interface BoardTileProps {
  space: BoardSpace;
  edge: TileEdge;
  flavor: BoardTileFlavor;
  gameMode?: GameMode;
  ownership?: PropertyState | null;
  ownerColor?: string | null;
  players?: BoardPlayer[];
  walkingPlayerIds?: Set<string>;
  isSelected?: boolean;
  selectionTone?: BoardTileSelectionTone | null;
  isDimmed?: boolean;
  onSelect?: () => void;
}
