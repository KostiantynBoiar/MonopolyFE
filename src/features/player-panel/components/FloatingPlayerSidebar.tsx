'use client';

import type { Player } from '../player-panel.schema';
import { PlayerSidebar } from './PlayerSidebar';

interface FloatingPlayerSidebarProps {
  players: Player[];
}

export function FloatingPlayerSidebar({ players }: FloatingPlayerSidebarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 md:inset-y-0 md:right-0 md:left-auto md:w-72 md:p-4">
      <div className="pointer-events-auto h-full max-h-[40vh] md:max-h-none">
        <PlayerSidebar players={players} />
      </div>
    </div>
  );
}
