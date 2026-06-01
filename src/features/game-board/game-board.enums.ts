export enum SpaceType {
  CORNER = 'corner',
  PROPERTY = 'property',
  RAILROAD = 'railroad',
  UTILITY = 'utility',
  CHANCE = 'chance',
  CHEST = 'chest',
  TAX = 'tax',
}

export enum TileTopStyle {
  INK = 'bg-ink',
  ORANGE = 'bg-band-orange',
  CYAN = 'bg-band-cyan',
  RED = 'bg-red',
}

export enum TileSymbol {
  RAILROAD = '🚂',
  UTILITY = '⚡',
  CHANCE = '?',
  CHEST = '📦',
  TAX = '$',
}

export enum TileTopText {
  NONE = '',
  CHANCE = 'CHANCE',
  CHEST = 'COMMUNITY CHEST',
}

export enum PropertyColor {
  BROWN = 'brown',
  CYAN = 'cyan',
  PINK = 'pink',
  ORANGE = 'orange',
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
  BLUE = 'blue',
}

export enum CornerVariant {
  GO = 'go',
  JAIL = 'jail',
  PARKING = 'parking',
  GOTO_JAIL = 'gotojail',
}

export enum BoardTileFlavor {
  PROPERTY = 'property',
  CORNER = 'corner',
  SPECIAL = 'special',
}

export enum TileEdge {
  BOTTOM = 'bottom',
  LEFT = 'left',
  TOP = 'top',
  RIGHT = 'right',
  CORNER = 'corner',
}
