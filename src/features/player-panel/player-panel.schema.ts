import type { PlayerState } from '@/shared/protocol/game-state';
import { COLOR_POSITIONS, POSITION_COLOR } from '@/shared/protocol/board-data';
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

export const COLOR_GROUP = POSITION_COLOR;

export const COLOR_GROUP_ORDER = Object.keys(COLOR_POSITIONS) as PropertyColor[];
