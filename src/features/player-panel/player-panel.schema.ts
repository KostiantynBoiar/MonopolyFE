import type { PropertyColor } from '@/features/game-board';
export type { PropertyColor };

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
  1: 'brown', 3: 'brown',
  6: 'cyan',  8: 'cyan',  9: 'cyan',
  11: 'pink', 13: 'pink', 14: 'pink',
  16: 'orange', 18: 'orange', 19: 'orange',
  21: 'red',  23: 'red',  24: 'red',
  26: 'yellow', 27: 'yellow', 29: 'yellow',
  31: 'green', 32: 'green', 34: 'green',
  37: 'blue', 39: 'blue',
};

export const COLOR_GROUP_ORDER: PropertyColor[] = [
  'brown', 'cyan', 'pink', 'orange', 'red', 'yellow', 'green', 'blue',
];
