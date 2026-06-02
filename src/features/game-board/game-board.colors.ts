import { PropertyColor } from '@/shared/protocol/game-state.enums';
import { CornerVariant, SpaceType } from './game-board.enums';
import type { BoardSpace } from './game-board.types';

export const GAME_BOARD_COLORS = {
  ink: '#f8f5f0',           // Soft warm background
  center: '#cab2b2',        // Main board surface
  panel: '#f2ede6',         // Side panels / UI areas
  surface: '#fffaf0',       // Cards, modals, popups
  border: '#d4c9b8',        // Gentle borders
  muted: '#8c7f6e',         // Secondary text / icons
  text: '#2c2a26',          // Primary text
  tile: '#f9f4eb',          // Default tile color
  tileBorder: '#c9b89f',    // Tile borders
  tileText: '#2c2a26',      // Tile text
  special: '#e07a5f',       // Warm accent (soft terracotta)
} as const;

export const BOARD_TILE_COLORS = {
  altText: '#f8f5f0',
  propertyBrown: '#9c6644',
  propertyCyan: '#4a9aa6',
  propertyPink: '#e07a8f',
  propertyOrange: '#e68a3d',
  propertyRed: '#d45d5d',
  propertyYellow: '#e3b23c',
  propertyGreen: '#4a8c5f',
  propertyBlue: '#4a7c9d',
  railroad: '#2c3e50',
  utility: '#2a6a8f',
} as const;

export const PROPERTY_COLOR_MAP: Record<PropertyColor, string> = {
  [PropertyColor.BROWN]: BOARD_TILE_COLORS.propertyBrown,
  [PropertyColor.CYAN]: BOARD_TILE_COLORS.propertyCyan,
  [PropertyColor.PINK]: BOARD_TILE_COLORS.propertyPink,
  [PropertyColor.ORANGE]: BOARD_TILE_COLORS.propertyOrange,
  [PropertyColor.RED]: BOARD_TILE_COLORS.propertyRed,
  [PropertyColor.YELLOW]: BOARD_TILE_COLORS.propertyYellow,
  [PropertyColor.GREEN]: BOARD_TILE_COLORS.propertyGreen,
  [PropertyColor.BLUE]: BOARD_TILE_COLORS.propertyBlue,
};

export const CORNER_COLOR_MAP: Record<CornerVariant, string> = {
  [CornerVariant.GO]: BOARD_TILE_COLORS.propertyBlue,
  [CornerVariant.JAIL]: BOARD_TILE_COLORS.propertyOrange,
  [CornerVariant.PARKING]: BOARD_TILE_COLORS.propertyGreen,
  [CornerVariant.GOTO_JAIL]: BOARD_TILE_COLORS.propertyRed,
};

export const SPACE_SYMBOL_MAP: Partial<Record<SpaceType, string>> = {
  [SpaceType.CHANCE]: '🎲',
  [SpaceType.CHEST]: '🎁',
  [SpaceType.RAILROAD]: '🚂',
  [SpaceType.UTILITY]: '💡',
  [SpaceType.TAX]: '💸',
};

export const SPACE_SURFACE_MAP: Partial<Record<SpaceType, string>> = {
  [SpaceType.CHANCE]: GAME_BOARD_COLORS.special,
  [SpaceType.CHEST]: GAME_BOARD_COLORS.special,
  [SpaceType.RAILROAD]: BOARD_TILE_COLORS.railroad,
  [SpaceType.UTILITY]: BOARD_TILE_COLORS.utility,
  [SpaceType.TAX]: BOARD_TILE_COLORS.propertyRed,
};

export function getSpaceHeaderColor(space: BoardSpace) {
  if (space.color) {
    return PROPERTY_COLOR_MAP[space.color];
  }

  if (space.corner) {
    return CORNER_COLOR_MAP[space.corner];
  }

  switch (space.type) {
    case SpaceType.CHANCE:
      return BOARD_TILE_COLORS.propertyYellow;
    case SpaceType.CHEST:
      return BOARD_TILE_COLORS.propertyCyan;
    case SpaceType.RAILROAD:
      return BOARD_TILE_COLORS.railroad;
    case SpaceType.UTILITY:
      return BOARD_TILE_COLORS.utility;
    case SpaceType.TAX:
      return BOARD_TILE_COLORS.propertyRed;
    default:
      return BOARD_TILE_COLORS.propertyBlue;
  }
}

export function getSpaceHeaderTextColor(_space: BoardSpace) {
  return BOARD_TILE_COLORS.altText;
}
