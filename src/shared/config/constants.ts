import { PropertyColor } from '@/features/game-board/game-board.enums';

// ─── Board scaling ────────────────────────────────────────────────────────────

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

// ─── Card flip animation ──────────────────────────────────────────────────────

export const CARD_FLIP_TRIGGER_DELAY_MS = 400;
export const CARD_FLIP_DURATION_MS = 600;
export const CARD_PROCEED_APPEAR_DELAY_MS = CARD_FLIP_DURATION_MS + 150;

// ─── Board space categories ───────────────────────────────────────────────────

export const CHANCE_POSITIONS = [7, 22, 36] as const;
export const CHEST_POSITIONS  = [2, 17, 33] as const;

// ─── Session / lobby ──────────────────────────────────────────────────────────

export const SESSION_MAX_PLAYERS       = 8;
export const SESSION_MIN_PLAYERS_TO_START = 2;