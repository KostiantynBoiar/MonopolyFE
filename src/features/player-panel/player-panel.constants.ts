// Buyable positions sorted by group — 28 total, laid out as a 7×4 rectangle.
// Only the layout/order is hardcoded; each cell's colour is derived at runtime
// so it can never drift from the actual tile colours.
import { NORMAL_BOARD_CONFIG } from '@/shared/config/board-layout';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { getSpaceHeaderColor } from '@/features/BoardTile/boardTile.colors';

export const SORTED_BUYABLE_POSITIONS: number[] = [
  1, 3,
  6, 8, 9,
  11, 13, 14,
  16, 18, 19,
  21, 23, 24,
  26, 27, 29,
  31, 32, 34,
  37, 39,
  5, 15, 25, 35,
  12, 28,
];

export const SORTED_BUYABLE_SPACES: Array<{ pos: number; color: string }> = SORTED_BUYABLE_POSITIONS.map(
  (pos) => {
    const space = NORMAL_BOARD_CONFIG.spacesByPosition[pos];
    return { pos, color: space ? getSpaceHeaderColor(space) : GAME_BOARD_COLORS.border };
  },
);
