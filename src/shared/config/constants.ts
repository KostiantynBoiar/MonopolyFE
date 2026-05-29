import { PropertyColor } from '@/features/game-board/game-board.enums';

/* Used for scaling the game board */
export const BASE_PX = 686;

// Tile pixel dimensions
export const N = 56;  // narrow edge
export const W = 91;  // wide edge (corner size)

export const gridCols = `${W}px repeat(9, ${N}px) ${W}px`;
export const gridRows = `${W}px repeat(9, ${N}px) ${W}px`;
export const BOARD_PX = W * 2 + N * 9; // 686

export const bandColors: Record<PropertyColor, string> = {
  [PropertyColor.BROWN]: 'bg-band-brown',
  [PropertyColor.CYAN]: 'bg-band-cyan',
  [PropertyColor.PINK]: 'bg-band-pink',
  [PropertyColor.ORANGE]: 'bg-band-orange',
  [PropertyColor.RED]: 'bg-band-red',
  [PropertyColor.YELLOW]: 'bg-band-yellow',
  [PropertyColor.GREEN]: 'bg-band-green',
  [PropertyColor.BLUE]: 'bg-band-blue',
};