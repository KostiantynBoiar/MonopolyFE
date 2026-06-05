import { PropertyColor } from '@/shared/protocol/game-state.enums';
import { CornerVariant, SpaceType } from './game-board.enums';
import type { BoardSpace } from './game-board.types';

export const GAME_BOARD_COLORS = {
  ink: 'var(--board-ink)',
  center: 'var(--board-center)',
  panel: 'var(--board-panel)',
  surface: 'var(--board-surface)',
  border: 'var(--board-border)',
  muted: 'var(--board-muted)',
  text: 'var(--board-text)',
  tile: 'var(--board-tile)',
  tileBorder: 'var(--board-tile-border)',
  tileText: 'var(--board-tile-text)',
  special: 'var(--board-special)',
} as const;

export const BOARD_TILE_COLORS = {
  altText: 'var(--prop-alt-text)',
  propertyBrown: 'var(--prop-brown)',
  propertyCyan: 'var(--prop-cyan)',
  propertyPink: 'var(--prop-pink)',
  propertyOrange: 'var(--prop-orange)',
  propertyRed: 'var(--prop-red)',
  propertyYellow: 'var(--prop-yellow)',
  propertyGreen: 'var(--prop-green)',
  propertyBlue: 'var(--prop-blue)',
  railroad: 'var(--prop-railroad)',
  utility: 'var(--prop-utility)',
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
