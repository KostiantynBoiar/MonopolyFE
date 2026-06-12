'use client';

import { PlayerPanel } from '@/features/player-panel';
import type { Player } from '@/features/player-panel/player-panel.schema';
import type { LogEntry, PropertyState } from '@/shared/protocol/game-state';

export interface GameSidebarWidgetProps {
  players: Player[];
  spaces?: PropertyState[];
  log?: LogEntry[];
  viewerId?: string;
  createdAt?: string;
  onSurrender?: () => void;
}

export function GameSidebarWidget(props: GameSidebarWidgetProps) {
  return <PlayerPanel {...props} />;
}
