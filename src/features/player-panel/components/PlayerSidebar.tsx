import { cn } from '@/shared/lib/cn';
import type { Player } from '../player-panel.schema';
import { PlayerCard } from './PlayerCard';

type PlayerSidebarProps = {
  players: Player[];
  className?: string;
};

export function PlayerSidebar({ players, className }: PlayerSidebarProps) {
  const active = players.find((p) => p.isActive);
  const alive = players.filter((p) => !p.isBankrupt);
  const bankrupt = players.filter((p) => p.isBankrupt);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 overflow-y-auto px-3 py-4',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink">Players</h2>
        <span className="font-mono text-xs text-muted">
          {alive.length}/{players.length}
        </span>
      </div>

      {/* Current turn summary */}
      {active && (
        <div className="rounded border border-gold/30 bg-gold-50 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-gold-600">Current turn</p>
          <p className="mt-0.5 truncate font-sans text-sm font-semibold text-ink">{active.name}</p>
        </div>
      )}

      {/* Player list */}
      <div className="flex flex-col gap-2">
        {alive.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      {/* Bankrupt players */}
      {bankrupt.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Bankrupt
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="flex flex-col gap-2">
            {bankrupt.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
