import { PropertyColor } from '@/features/game-board/game-board.enums';
export { PropertyColor };

export type TokenColor =
  | 'blue' | 'red' | 'green' | 'yellow'
  | 'orange' | 'pink' | 'cyan' | 'brown'
  | 'gold' | 'ink';

export type Player = {
  id: string;
  name: string;
  balance: number;
  position: number;
  token: TokenColor;
  ownedPositions: number[];
  isActive: boolean;
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns?: number;
};

export const TOKEN_COLORS: Record<TokenColor, string> = {
  blue:   '#2B57C6',
  red:    '#C53A33',
  green:  '#2E7D4F',
  yellow: '#DDAE1A',
  orange: '#D9802C',
  pink:   '#C24C8B',
  cyan:   '#8FC9DC',
  brown:  '#6B4A2E',
  gold:   '#C6951C',
  ink:    '#10182E',
};

export const COLOR_GROUP: Record<number, PropertyColor> = {
  1: PropertyColor.BROWN, 3: PropertyColor.BROWN,
  6: PropertyColor.CYAN,  8: PropertyColor.CYAN,  9: PropertyColor.CYAN,
  11: PropertyColor.PINK, 13: PropertyColor.PINK, 14: PropertyColor.PINK,
  16: PropertyColor.ORANGE, 18: PropertyColor.ORANGE, 19: PropertyColor.ORANGE,
  21: PropertyColor.RED,  23: PropertyColor.RED,  24: PropertyColor.RED,
  26: PropertyColor.YELLOW, 27: PropertyColor.YELLOW, 29: PropertyColor.YELLOW,
  31: PropertyColor.GREEN, 32: PropertyColor.GREEN, 34: PropertyColor.GREEN,
  37: PropertyColor.BLUE, 39: PropertyColor.BLUE,
};

export const COLOR_GROUP_ORDER: PropertyColor[] = [
  PropertyColor.BROWN,
  PropertyColor.CYAN,
  PropertyColor.PINK,
  PropertyColor.ORANGE,
  PropertyColor.RED,
  PropertyColor.YELLOW,
  PropertyColor.GREEN,
  PropertyColor.BLUE,
];
