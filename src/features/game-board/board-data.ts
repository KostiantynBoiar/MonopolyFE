export type SpaceType = 'corner' | 'property' | 'railroad' | 'utility' | 'chance' | 'chest' | 'tax';
export type PropertyColor = 'brown' | 'cyan' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'blue';
export type CornerVariant = 'go' | 'jail' | 'parking' | 'gotojail';
export type TileEdge = 'bottom' | 'left' | 'top' | 'right' | 'corner';

/** Minimal player data the board needs to render tokens. Resolved to hex by the caller
 *  so the game-board feature has no runtime dep on player-panel (which imports from here). */
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

export const BOARD: BoardSpace[] = [
  { pos: 0,  type: 'corner',   name: 'TYCOON',                    corner: 'go' },
  { pos: 1,  type: 'property', name: 'Mediterranean Ave',     price: 60,  color: 'brown' },
  { pos: 2,  type: 'chest',    name: 'Community Chest' },
  { pos: 3,  type: 'property', name: 'Baltic Ave',            price: 60,  color: 'brown' },
  { pos: 4,  type: 'tax',      name: 'Income Tax',            price: 200 },
  { pos: 5,  type: 'railroad', name: 'Reading Railroad',      price: 200 },
  { pos: 6,  type: 'property', name: 'Oriental Ave',          price: 100, color: 'cyan' },
  { pos: 7,  type: 'chance',   name: 'Chance' },
  { pos: 8,  type: 'property', name: 'Vermont Ave',           price: 100, color: 'cyan' },
  { pos: 9,  type: 'property', name: 'Connecticut Ave',       price: 120, color: 'cyan' },
  { pos: 10, type: 'corner',   name: 'Just Visiting',         corner: 'jail' },
  { pos: 11, type: 'property', name: 'St. Charles Place',     price: 140, color: 'pink' },
  { pos: 12, type: 'utility',  name: 'Electric Company',      price: 150 },
  { pos: 13, type: 'property', name: 'States Ave',            price: 140, color: 'pink' },
  { pos: 14, type: 'property', name: 'Virginia Ave',          price: 160, color: 'pink' },
  { pos: 15, type: 'railroad', name: 'Pennsylvania Railroad', price: 200 },
  { pos: 16, type: 'property', name: 'St. James Place',       price: 180, color: 'orange' },
  { pos: 17, type: 'chest',    name: 'Community Chest' },
  { pos: 18, type: 'property', name: 'Tennessee Ave',         price: 180, color: 'orange' },
  { pos: 19, type: 'property', name: 'New York Ave',          price: 200, color: 'orange' },
  { pos: 20, type: 'corner',   name: 'Free Parking',          corner: 'parking' },
  { pos: 21, type: 'property', name: 'Kentucky Ave',          price: 220, color: 'red' },
  { pos: 22, type: 'chance',   name: 'Chance' },
  { pos: 23, type: 'property', name: 'Indiana Ave',           price: 220, color: 'red' },
  { pos: 24, type: 'property', name: 'Illinois Ave',          price: 240, color: 'red' },
  { pos: 25, type: 'railroad', name: 'B&O Railroad',          price: 200 },
  { pos: 26, type: 'property', name: 'Atlantic Ave',          price: 260, color: 'yellow' },
  { pos: 27, type: 'property', name: 'Ventnor Ave',           price: 260, color: 'yellow' },
  { pos: 28, type: 'utility',  name: 'Water Works',           price: 150 },
  { pos: 29, type: 'property', name: 'Marvin Gardens',        price: 280, color: 'yellow' },
  { pos: 30, type: 'corner',   name: 'Go to Jail',            corner: 'gotojail' },
  { pos: 31, type: 'property', name: 'Pacific Ave',           price: 300, color: 'green' },
  { pos: 32, type: 'property', name: 'North Carolina Ave',    price: 300, color: 'green' },
  { pos: 33, type: 'chest',    name: 'Community Chest' },
  { pos: 34, type: 'property', name: 'Pennsylvania Ave',      price: 320, color: 'green' },
  { pos: 35, type: 'railroad', name: 'Short Line Railroad',   price: 200 },
  { pos: 36, type: 'chance',   name: 'Chance' },
  { pos: 37, type: 'property', name: 'Park Place',            price: 350, color: 'blue' },
  { pos: 38, type: 'tax',      name: 'Luxury Tax',            price: 100 },
  { pos: 39, type: 'property', name: 'Boardwalk',             price: 400, color: 'blue' },
];

export function getGridPos(pos: number): { col: number; row: number } {
  if (pos <= 10) return { col: 10 - pos, row: 10 };
  if (pos <= 20) return { col: 0, row: 20 - pos };
  if (pos <= 30) return { col: pos - 20, row: 0 };
  return { col: 10, row: pos - 30 };
}

export function getTileEdge(pos: number): TileEdge {
  if (pos % 10 === 0) return 'corner';
  if (pos < 10) return 'bottom';
  if (pos < 20) return 'left';
  if (pos < 30) return 'top';
  return 'right';
}
