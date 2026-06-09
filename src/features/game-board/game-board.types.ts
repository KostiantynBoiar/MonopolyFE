import { type ReactNode } from 'react';
import type { Player } from '@/features/player-panel';
import type { WalkingAnimationVariant } from '@/shared/protocol/animation';
import type { LogEntry, PropertyState } from '@/shared/protocol/game-state';
import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { TileSymbol, TileTopStyle, TileTopText, SpaceType, CornerVariant, TileEdge, BoardTileFlavor, BoardTileSelectionTone } from './game-board.enums';
import type { TokenShape } from './token-shapes';

export interface WalkingPlayer {
  id: string;
  currentPos: number;
  tokenColor: string;
  tokenShape: TokenShape;
  variant?: WalkingAnimationVariant;
}

export interface BoardContainerProps {
  centerContent?: ReactNode;
  centerSlots?: BoardCenterSlots;
  spaces?: PropertyState[];
  players?: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
  sidebarPlayers?: Player[];
  log?: LogEntry[];
  selectedPosition?: number | null;
  tileSelectionTones?: Partial<Record<number, BoardTileSelectionTone>>;
  onSelectPosition?: (position: number) => void;
  /** When set, all tiles except this position are dimmed. */
  focusPosition?: number | null;
  /** When set, all tiles outside this set are dimmed. */
  focusPositions?: Set<number> | null;
  viewerId?: string;
  createdAt?: string;
  onSurrender?: () => void;
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
  isSelected?: boolean;
  selectionTone?: BoardTileSelectionTone | null;
  isDimmed?: boolean;
  onSelect?: () => void;
}

export interface BoardPlayer {
  id: string;
  position: number;
  tokenColor: string; // resolved hex, e.g. '#2B57C6'
  tokenShape: TokenShape; // MD3-Expressive silhouette, shuffled per game
  isBankrupt: boolean;
  inJail?: boolean; // true when jailed — placed inside the Jail cell, not the margin
  avatarUrl?: string | null; // PNG / WebP / SVG / any <img>-renderable URL
}

export interface BoardSpace {
  pos: number;
  type: SpaceType;
  price?: number;
  color?: PropertyColor;
  corner?: CornerVariant;
}
