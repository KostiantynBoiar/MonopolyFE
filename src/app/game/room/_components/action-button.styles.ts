import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

export const ACTION_CLASS =
  'rounded-[14px] border will-change-transform transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out disabled:cursor-not-allowed enabled:hover:-translate-y-[2px] enabled:active:translate-y-0 enabled:active:scale-[0.97]';

export const ACTION_PAD = {
  paddingTop: 'clamp(4px,0.6vmin,8px)',
  paddingBottom: 'clamp(4px,0.6vmin,8px)',
} as const;

export const DISABLED_ACTION = {
  backgroundColor: GAME_BOARD_COLORS.surface,
  borderColor: GAME_BOARD_COLORS.border,
  color: GAME_BOARD_COLORS.muted,
  boxShadow: 'none',
  ...ACTION_PAD,
} as const;

export const GHOST_ACTION = {
  backgroundColor: GAME_BOARD_COLORS.surface,
  borderColor: GAME_BOARD_COLORS.border,
  color: GAME_BOARD_COLORS.text,
  boxShadow: '0 1px 2px rgba(51,48,43,0.08)',
  ...ACTION_PAD,
} as const;

export function accentAction(color: string, shadow: string) {
  return {
    backgroundColor: color,
    borderColor: color,
    color: BOARD_TILE_COLORS.altText,
    boxShadow: shadow,
    ...ACTION_PAD,
  } as const;
}

export const ROLL_FONT = { fontSize: 'clamp(12px,1.8vmin,20px)' } as const;
