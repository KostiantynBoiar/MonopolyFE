import type { Player } from '../player-panel.schema';
import { TOKEN_COLORS } from '../player-panel.schema';

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <article className="rounded-lg border border-line bg-surface p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-serif text-sm font-semibold text-ink">
            {player.name}
          </p>
          <p className="text-xs text-muted">
            ${player.balance.toLocaleString()}
          </p>
        </div>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/60 shadow-sm"
          style={{ backgroundColor: TOKEN_COLORS[player.token] }}
          aria-label={`${player.name} token`}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue">
          Pos {player.position}
        </span>
        {player.isActive && (
          <span className="rounded-full bg-gold-50 px-2 py-0.5 text-gold">
            Active
          </span>
        )}
        {player.inJail && (
          <span className="rounded-full bg-red/10 px-2 py-0.5 text-red">
            In jail
          </span>
        )}
        {player.isBankrupt && (
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-ink">
            Bankrupt
          </span>
        )}
      </div>
    </article>
  );
}
