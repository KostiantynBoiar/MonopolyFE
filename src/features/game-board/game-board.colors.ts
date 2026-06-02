import { CornerVariant, PropertyColor, SpaceType } from './game-board.enums';
import type { BoardSpace } from './game-board.types';

export const GAME_BOARD_COLORS = {
  ink: '#faf4ed',
  center: '#fffaf3',
  panel: '#f2e9e1',
  surface: '#fffaf3',
  border: '#cecacd',
  muted: '#837e9f',
  text: '#575279',
  tile: '#f2e9e1',
  tileBorder: '#cecacd',
  tileText: '#575279',
  special: '#ea9d34',
} as const;

export const BOARD_TILE_COLORS = {
  altText: GAME_BOARD_COLORS.surface,
  propertyBrown: '#6B4A2E',
  propertyCyan: '#286983',
  propertyPink: '#d7827e',
  propertyOrange: '#ea9d34',
  propertyRed: '#b4637a',
  propertyYellow: '#DDAE1A',
  propertyGreen: '#2E7D4F',
  propertyBlue: '#56949f',
  railroad: '#1b2b4d',
  utility: '#1d5b99',
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
  [SpaceType.UTILITY]: GAME_BOARD_COLORS.special,
  [SpaceType.TAX]: GAME_BOARD_COLORS.special,
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
