import type { Player } from '../player-panel.schema';
import { TOKEN_COLORS } from '../player-panel.schema';

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg font-semibold text-ink">
            {player.name}
          </p>
          <p className="text-sm text-muted">
            ${player.balance.toLocaleString()}
          </p>
        </div>
        <span
          className="h-3 w-3 rounded-full border border-white/60 shadow-sm"
          style={{ backgroundColor: TOKEN_COLORS[player.token] }}
          aria-label={`${player.name} token`}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue">
          Pos {player.position}
        </span>
        {player.isActive && (
          <span className="rounded-full bg-gold-50 px-2.5 py-1 text-gold">
            Active
          </span>
        )}
        {player.inJail && (
          <span className="rounded-full bg-red/10 px-2.5 py-1 text-red">
            In jail
          </span>
        )}
        {player.isBankrupt && (
          <span className="rounded-full bg-ink/10 px-2.5 py-1 text-ink">
            Bankrupt
          </span>
        )}
      </div>
    </article>
  );
}
