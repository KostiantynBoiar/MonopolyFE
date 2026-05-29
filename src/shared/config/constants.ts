import { PropertyColor } from "@/features/player-panel/player-panel.schema";

/* Used for scaling the game board */
export const BASE_PX = 686;

// Tile pixel dimensions
export const N = 56;  // narrow edge
export const W = 91;  // wide edge (corner size)

export const gridCols = `${W}px repeat(9, ${N}px) ${W}px`;
export const gridRows = `${W}px repeat(9, ${N}px) ${W}px`;
export const BOARD_PX = W * 2 + N * 9; // 686

export const bandColors: Record<PropertyColor, string> = {
  brown: 'bg-band-brown',
  cyan: 'bg-band-cyan',
  pink: 'bg-band-pink',
  orange: 'bg-band-orange',
  red: 'bg-band-red',
  yellow: 'bg-band-yellow',
  green: 'bg-band-green',
  blue: 'bg-band-blue',
};