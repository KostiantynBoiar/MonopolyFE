import { type ReactNode } from 'react';
import type { Player } from '@/features/player-panel/player-panel.schema';
import type { WalkingAnimationVariant } from '@/shared/protocol/animation';
import type { LogEntry, PropertyState } from '@/shared/protocol/game-state';
import type { GameMode } from '@/shared/protocol/game-state.enums';
import type { BoardPlayer } from '@/features/BoardTile/boardTile.schema';
import type { TokenShape } from '@/features/BoardTile/token-shapes';
import type { BoardTileSelectionTone } from './game-board.enums';

// Re-exported for consumers that still import from this path.
export type { BoardPlayer, BoardSpace, BoardTileProps } from '@/features/BoardTile/boardTile.schema';

export interface WalkingPlayer {
  id: string;
  currentPos: number;
  tokenColor: string;
  tokenShape: TokenShape;
  variant?: WalkingAnimationVariant;
}

export interface BoardCenterSlots {
  dice?: ReactNode;
  actions?: ReactNode;
  chat?: ReactNode;
  deed?: ReactNode;
}

export interface BoardContainerProps {
  gameMode?: GameMode;
  centerContent?: ReactNode;
  centerSlots?: BoardCenterSlots;
  spaces?: PropertyState[];
  players?: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
  sidebarPlayers?: Player[];
  log?: LogEntry[];
  selectedPosition?: number | null;
  tileSelectionTones?: Partial<Record<number, BoardTileSelectionTone>>;
  onSelectPosition?: (position: number) => void;
  focusPosition?: number | null;
  focusPositions?: Set<number> | null;
  viewerId?: string;
  createdAt?: string;
  onSurrender?: () => void;
}
