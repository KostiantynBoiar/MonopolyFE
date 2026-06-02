import type { PlayerState } from '@/shared/protocol/game-state';
import { COLOR_POSITIONS, POSITION_COLOR } from '@/shared/protocol/board-data';
import { PropertyColor } from '@/shared/protocol/game-state.enums';

export { PropertyColor };

export type PlayerPanelPlayer = Pick<
  PlayerState,
  'id' | 'balance' | 'position' | 'token' | 'isBankrupt'
> & {
  name: PlayerState['displayName'];
  avatarUrl?: PlayerState['avatarUrl'];
  ownedPositions: number[];
  isActive: boolean;
  inJail: boolean;
  jailTurns?: number;
};

export type Player = PlayerPanelPlayer;

export const COLOR_GROUP = POSITION_COLOR;

export const COLOR_GROUP_ORDER = Object.keys(COLOR_POSITIONS) as PropertyColor[];
