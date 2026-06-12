import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

const C = GAME_BOARD_COLORS;

export const PANEL_BORDER_STYLE = {
  borderColor: C.border,
  backgroundColor: C.surface,
} as const;

export const TRANSCRIPT_TEXTURE = {
  backgroundColor: C.panel,
  backgroundImage: `radial-gradient(${C.border} 0.5px, transparent 0.5px)`,
  backgroundSize: '14px 14px',
} as const;
