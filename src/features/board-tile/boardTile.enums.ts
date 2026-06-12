export enum TileEdge {
  BOTTOM = 'bottom',
  LEFT = 'left',
  TOP = 'top',
  RIGHT = 'right',
  CORNER = 'corner',
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

export enum BoardTileSelectionTone {
  TRADE_OFFER = 'trade_offer',
  TRADE_REQUEST = 'trade_request',
}
