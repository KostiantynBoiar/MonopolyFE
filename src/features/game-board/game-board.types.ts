import { type ReactNode } from 'react';
import type { SpaceOwnership } from '@/shared/protocol/game-state.schema';
import { TileSymbol, TileTopStyle, TileTopText, SpaceType, CornerVariant, PropertyColor } from './game-board.enums';

export type BoardContainerProps = {
  centerContent?: ReactNode;
  spaces?: SpaceOwnership[];
  players?: BoardPlayer[];
};

export type CornerTileProps = {
  variant: CornerVariant;
  className?: string;
};

export type TileContentProps = {
  space: BoardSpace;
  ownership?: SpaceOwnership;
  ownerColor?: string;
  flipped?: boolean;
};

export type MonopolyBoardProps = {
  scale?: number;
  centerContent?: ReactNode;
  spaces?: SpaceOwnership[];
  players?: BoardPlayer[];
};

export type PropertyTileProps = {
  name: string;
  price: number;
  color: PropertyColor;
  mortgaged?: boolean;
  houseCount?: 0 | 1 | 2 | 3 | 4 | 5;
  ownerColor?: string; // hex token color of the owning player
  flipped?: boolean;
  className?: string;
};

export type SpecialTileType = Exclude<
  SpaceType,
  SpaceType.CORNER | SpaceType.PROPERTY
>;

export type SpecialTileProps = {
  type: SpecialTileType;
  name: string;
  price?: number;
  mortgaged?: boolean;
  ownerColor?: string;
  flipped?: boolean;
  className?: string;
};

export type TileStyleConfig = {
  top: TileTopStyle;
  symbol: TileSymbol;
  topText: TileTopText;
};

export type BoardPlayer = {
  id: string;
  position: number;
  tokenColor: string; // resolved hex, e.g. '#2B57C6'
  isBankrupt: boolean;
};

export type BoardSpace = {
  pos: number;
  type: SpaceType;
  name: string;
  price?: number;
  color?: PropertyColor;
  corner?: CornerVariant;
};