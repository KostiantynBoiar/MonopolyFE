import type { Player } from '../player-panel.schema';
import { PlayerCard } from './PlayerCard';

interface PlayerSidebarProps {
  players: Player[];
}

export function PlayerSidebar({ players }: PlayerSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-[24px] border border-line bg-paper/90 p-3">
      <div className="px-1">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Players
        </p>
      </div>
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </aside>
  );
}
