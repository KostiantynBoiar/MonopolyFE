import { type ReactNode } from 'react';
import type { Player } from '@/features/player-panel';
import type { PropertyState } from '@/shared/protocol/game-state';
import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import { TileSymbol, TileTopStyle, TileTopText, SpaceType, CornerVariant, TileEdge, BoardTileFlavor } from './game-board.enums';

export interface WalkingPlayer {
  id: string;
  currentPos: number;
  tokenColor: string;
  fast?: boolean;
}

export interface BoardContainerProps {
  centerContent?: ReactNode;
  centerSlots?: BoardCenterSlots;
  spaces?: PropertyState[];
  players?: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
  sidebarPlayers?: Player[];
}

export interface BoardCenterSlots {
  dice?: ReactNode;
  actions?: ReactNode;
  chat?: ReactNode;
  deed?: ReactNode;
}

export interface CornerTileProps {
  variant: CornerVariant;
  className?: string;
}

export interface TileContentProps {
  space: BoardSpace;
  ownership?: PropertyState | null;
  ownerColor?: string;
  flipped?: boolean;
}

export interface MonopolyBoardProps {
  scale?: number;
  centerContent?: ReactNode;
  spaces?: PropertyState[];
  players?: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
}

export interface PropertyTileProps {
  name: string;
  price: number;
  color: PropertyColor;
  mortgaged?: boolean;
  houseCount?: 0 | 1 | 2 | 3 | 4 | 5;
  ownerColor?: string; // hex token color of the owning player
  flipped?: boolean;
  className?: string;
}

export type SpecialTileType = Exclude<
  SpaceType,
  SpaceType.CORNER | SpaceType.PROPERTY
>;

export interface SpecialTileProps {
  type: SpecialTileType;
  name: string;
  price?: number;
  mortgaged?: boolean;
  ownerColor?: string;
  flipped?: boolean;
  className?: string;
}

export interface TileStyleConfig {
  top: TileTopStyle;
  symbol: TileSymbol;
  topText: TileTopText;
}

export interface BoardTileProps {
  space: BoardSpace;
  edge: TileEdge;
  flavor: BoardTileFlavor;
  ownership?: PropertyState | null;
  /** Resolved hex token color of the owning player, or null if unowned. */
  ownerColor?: string | null;
  players?: BoardPlayer[];
  walkingPlayerIds?: Set<string>;
}

export interface BoardPlayer {
  id: string;
  position: number;
  tokenColor: string; // resolved hex, e.g. '#2B57C6'
  isBankrupt: boolean;
  avatarUrl?: string | null; // PNG / WebP / SVG / any <img>-renderable URL
}

export interface BoardSpace {
  pos: number;
  type: SpaceType;
  name: string;
  price?: number;
  color?: PropertyColor;
  corner?: CornerVariant;
}
