import { PropertyColor, TokenColor } from '@/shared/protocol/game-state.enums';
import { SocketStatus } from '../socket';
import { StatusDot } from '@/features/lobby/lobby.enums';

// ─── Board scaling ────────────────────────────────────────────────────────────

// Tile pixel dimensions
export const N  = 56;  // narrow tile height (row tiles)
export const NW = 72;  // narrow tile width (column tiles) — wider board on landscape screens
export const W  = 91;  // wide edge (corner size)

export const gridCols = `${W}px repeat(9, ${NW}px) ${W}px`;
export const gridRows = `${W}px repeat(9, ${N}px) ${W}px`;
export const BOARD_W  = W * 2 + NW * 9; // 830 — board pixel width
export const BOARD_PX = W * 2 + N * 9;  // 686 — board pixel height

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

// ─── Walking animation ────────────────────────────────────────────────────────

export const WALK_STEP_DURATION_MS      = 180; // CSS transition duration per board step (normal moves)
export const CARD_WALK_STEP_DURATION_MS = 55;  // CSS transition + step interval for card-driven moves

// ─── Card flip animation ──────────────────────────────────────────────────────

export const CARD_FLIP_TRIGGER_DELAY_MS = 400;
export const CARD_FLIP_DURATION_MS = 600;
export const CARD_PROCEED_APPEAR_DELAY_MS = CARD_FLIP_DURATION_MS + 150;

// ─── Board space categories ───────────────────────────────────────────────────

export const CHANCE_POSITIONS = [7, 22, 36] as const;
export const CHEST_POSITIONS  = [2, 17, 33] as const;

// ─── Session / lobby ──────────────────────────────────────────────────────────

export const SESSION_MAX_PLAYERS          = 8;
export const SESSION_MIN_PLAYERS_TO_START = 2;
export const LOBBY_PAGE_SIZE              = 4;  // sessions per page; matches ?limit= param
export const POLL_INTERVAL_MS = 10_000;

export const TOKEN_ORDER: TokenColor[] = [
  TokenColor.BLUE,
  TokenColor.RED,
  TokenColor.GREEN,
  TokenColor.GOLD,
  TokenColor.ORANGE,
  TokenColor.PINK,
  TokenColor.CYAN,
  TokenColor.BROWN,
];

export const TOKEN_COLORS: Record<TokenColor, string> = {
  [TokenColor.BLUE]:   '#2B57C6',
  [TokenColor.RED]:    '#C53A33',
  [TokenColor.GREEN]:  '#2E7D4F',
  [TokenColor.YELLOW]: '#DDAE1A',
  [TokenColor.ORANGE]: '#D9802C',
  [TokenColor.PINK]:   '#C24C8B',
  [TokenColor.CYAN]:   '#8FC9DC',
  [TokenColor.BROWN]:  '#6B4A2E',
  [TokenColor.GOLD]:   '#C6951C',
  [TokenColor.INK]:    '#10182E',
};

// ─── WebSocket ───────────────────────────────────────────────────────────────────

export const STATUS_DOT: Record<SocketStatus, StatusDot> = {
  connecting: StatusDot.CONNECTING,
  open: StatusDot.OPEN,
  error: StatusDot.ERROR,
  closed: StatusDot.CLOSED,
};

export const BASE_DELAY_MS = 1_000;
export const MAX_DELAY_MS  = 30_000;
export const JITTER_RATIO  = 0.2;   // ±20% randomization to spread reconnect storms

// ─── Dice Animation ───────────────────────────────────────────────────────────────────


// Total CSS animation duration. timeline-executor's DICE_SPIN_MS must match.
export const SPIN_MS = 900;
export const FAST_PHASE_MS       = 560;
export const FAST_INTERVAL_MS    = 42;
export const SLOW_INTERVAL_MS    = 130;