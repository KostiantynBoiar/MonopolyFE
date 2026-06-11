import type { PlayerState } from '@/shared/protocol/game-state';
import { NORMAL_COLOR_POSITIONS, NORMAL_POSITION_COLOR } from '@/shared/protocol/board-data';
import { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { TokenShape } from '@/features/game-board/token-shapes';

export { PropertyColor };

export type PlayerPanelPlayer = Pick<
  PlayerState,
  'id' | 'balance' | 'position' | 'token' | 'isBankrupt' | 'rating'
> & {
  name: PlayerState['displayName'];
  avatarUrl?: PlayerState['avatarUrl'];
  /** MD3 silhouette matching the player's board token; optional pre-game. */
  tokenShape?: TokenShape;
  ownedPositions: number[];
  isActive: boolean;
  inJail: boolean;
  jailTurns?: number;
};

export type Player = PlayerPanelPlayer;

export const COLOR_GROUP = NORMAL_POSITION_COLOR;

export const COLOR_GROUP_ORDER = Object.keys(NORMAL_COLOR_POSITIONS) as PropertyColor[];
