import { useRef, useState, type ReactNode } from 'react';
import type { Player } from '@/features/player-panel';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { BOARD } from '@/shared/config/board-layout';
import { useBalanceChange } from '@/shared/hooks/useBalanceChange';
import { CornerVariant } from '../game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor } from '../game-board.colors';

interface PlayerPanelProps {
  players: Player[];
}

interface BalanceDeltaEntry {
  id: number;
  amount: number;
}

function getOwnedProperties(player: Player) {
  return player.ownedPositions
    .map((position) => BOARD.find((boardSpace) => boardSpace.pos === position))
    .filter((space): space is NonNullable<typeof space> => Boolean(space));
}

function getPositionPillColor(position: number) {
  const space = BOARD.find((boardSpace) => boardSpace.pos === position);
  return space ? getSpaceHeaderColor(space) : BOARD_TILE_COLORS.propertyBlue;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlayerAvatar({ player }: { player: Player }) {
  const tokenColor = TOKEN_COLORS[player.token];

  if (player.avatarUrl) {
    return (
      <span
        className="block h-10 w-10 shrink-0 overflow-hidden rounded-full border-2"
        style={{ borderColor: tokenColor, boxShadow: '0 2px 6px rgba(0,0,0,.22)' }}
      >
        <img src={player.avatarUrl} alt={`${player.name} avatar`} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-black"
      style={{
        backgroundColor: tokenColor,
        borderColor: BOARD_TILE_COLORS.altText,
        color: BOARD_TILE_COLORS.altText,
        boxShadow: '0 2px 6px rgba(0,0,0,.22)',
      }}
    >
      {player.name.slice(0, 1)}
    </span>
  );
}

function StatusPill({
  children,
  backgroundColor,
  color = BOARD_TILE_COLORS.altText,
}: {
  children: ReactNode;
  backgroundColor: string;
  color?: string;
}) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
      style={{ backgroundColor, color }}
    >
      {children}
    </span>
  );
}

function BalanceDelta({
  entry,
  onDone,
}: {
  entry: BalanceDeltaEntry;
  onDone: () => void;
}) {
  const isGain = entry.amount > 0;
  return (
    <span
      className="pointer-events-none animate-balance-delta whitespace-nowrap font-mono text-xs font-black"
      style={{ color: isGain ? BOARD_TILE_COLORS.propertyGreen : BOARD_TILE_COLORS.propertyRed }}
      onAnimationEnd={onDone}
    >
      {isGain ? '+' : ''}{entry.amount.toLocaleString()} {isGain ? '▲' : '▼'}
    </span>
  );
}

// ─── PlayerPanel ──────────────────────────────────────────────────────────────

export function PlayerPanel({ players }: PlayerPanelProps) {
  const currentPlayer = players.find((player) => player.isActive);
  const jailSpace = BOARD.find((space) => space.corner === CornerVariant.JAIL);
  const jailColor = jailSpace ? getSpaceHeaderColor(jailSpace) : BOARD_TILE_COLORS.propertyOrange;

  const [deltas, setDeltas] = useState<Map<string, BalanceDeltaEntry>>(new Map());
  const deltaCounterRef = useRef(0);

  useBalanceChange(players, (changes) => {
    setDeltas((prev) => {
      const next = new Map(prev);
      for (const { playerId, delta } of changes) {
        next.set(playerId, { id: ++deltaCounterRef.current, amount: delta });
      }
      return next;
    });
  });

  function clearDelta(playerId: string) {
    setDeltas((prev) => {
      const next = new Map(prev);
      next.delete(playerId);
      return next;
    });
  }

  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-[18px] border p-4"
      style={{
        backgroundColor: GAME_BOARD_COLORS.panel,
        borderColor: GAME_BOARD_COLORS.border,
        color: GAME_BOARD_COLORS.text,
      }}
    >
      <div
        className="rounded-[14px] border px-3 py-3"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor: BOARD_TILE_COLORS.propertyBlue,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]">
          Current Turn
        </p>
        <p className="mt-1 truncate font-display text-2xl font-semibold">
          {currentPlayer?.name ?? 'Waiting'}
        </p>
      </div>

      <div className="grid min-h-0 gap-3">
        {players.map((player) => {
          const ownedProperties = getOwnedProperties(player);
          const delta = deltas.get(player.id);
          const netWorth = player.balance + ownedProperties.reduce((sum, prop) => {
            const priceGuess = (prop as { price?: number }).price ?? 0;
            return sum + priceGuess;
          }, 0);

          return (
            <article
              key={player.id}
              className="grid gap-3 rounded-[14px] border px-3 py-3"
              style={{
                backgroundColor: player.isActive ? GAME_BOARD_COLORS.center : GAME_BOARD_COLORS.surface,
                borderColor: player.isActive ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.text,
              }}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <PlayerAvatar player={player} />
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <p className="min-w-0 truncate font-display text-lg font-semibold leading-tight">
                      {player.name}
                    </p>
                    <StatusPill backgroundColor={getPositionPillColor(player.position)}>
                      Pos {player.position}
                    </StatusPill>
                    {player.isActive && (
                      <StatusPill backgroundColor={BOARD_TILE_COLORS.propertyBlue}>Turn</StatusPill>
                    )}
                    {player.inJail && (
                      <StatusPill backgroundColor={jailColor}>
                        Jail{player.jailTurns != null ? ` ${player.jailTurns}` : ''}
                      </StatusPill>
                    )}
                    {player.isBankrupt && (
                      <StatusPill backgroundColor={BOARD_TILE_COLORS.railroad}>Bankrupt</StatusPill>
                    )}
                  </div>

                  {/* Balance row */}
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <p
                      className="font-mono text-sm font-bold tabular-nums"
                      style={{ color: GAME_BOARD_COLORS.text }}
                    >
                      ${player.balance.toLocaleString()}
                    </p>
                    {delta && (
                      <BalanceDelta key={delta.id} entry={delta} onDone={() => clearDelta(player.id)} />
                    )}
                  </div>
                  {/* Net worth */}
                  <p className="font-mono text-[10px] tabular-nums" style={{ color: GAME_BOARD_COLORS.muted }}>
                    net ~${netWorth.toLocaleString()}
                  </p>
                </div>
              </div>

              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '0.125rem' }}
                aria-label={`${player.name} owned properties`}
              >
                {ownedProperties.length > 0 ? (
                  ownedProperties.slice(0, 28).map((property) => (
                    <span
                      key={property.pos}
                      className="aspect-square rounded-[3px] border"
                      style={{
                        backgroundColor: getSpaceHeaderColor(property),
                        borderColor: BOARD_TILE_COLORS.altText,
                        boxShadow: '0 0.5px 1.5px rgba(0,0,0,.22)',
                      }}
                      title={property.name}
                    />
                  ))
                ) : (
                  <span
                    className="text-[11px] font-semibold"
                    style={{ gridColumn: '1 / -1', color: GAME_BOARD_COLORS.muted }}
                  >
                    No properties
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
