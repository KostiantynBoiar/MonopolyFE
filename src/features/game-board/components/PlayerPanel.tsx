import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { Player } from '@/features/player-panel';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { BOARD } from '@/shared/config/board-layout';
import { useBalanceChange } from '@/shared/hooks/useBalanceChange';
import { CornerVariant } from '../game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor } from '../game-board.colors';

interface PlayerPanelProps {
  players:     Player[];
  viewerId?:   string;
  createdAt?:  string;
  onSurrender?: () => void;
}

function useSessionTimer(createdAt: string | undefined) {
  const [elapsed, setElapsed] = useState(() =>
    createdAt ? Date.now() - new Date(createdAt).getTime() : 0,
  );

  useEffect(() => {
    if (!createdAt) return;
    const id = setInterval(
      () => setElapsed(Date.now() - new Date(createdAt).getTime()),
      1000,
    );
    return () => clearInterval(id);
  }, [createdAt]);

  const s = Math.floor(elapsed / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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
  const t = useTranslations('Player');
  const tokenColor = TOKEN_COLORS[player.token];

  if (player.avatarUrl) {
    return (
      <span
        className="block h-10 w-10 shrink-0 overflow-hidden rounded-full border-2"
        style={{ borderColor: tokenColor, boxShadow: '0 2px 6px rgba(0,0,0,.22)' }}
      >
        <img src={player.avatarUrl} alt={t('avatarAlt', { name: player.name })} className="h-full w-full object-cover" />
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
      className="pointer-events-none animate-balance-delta whitespace-nowrap font-mono text-sm font-black"
      style={{ color: isGain ? BOARD_TILE_COLORS.propertyGreen : BOARD_TILE_COLORS.propertyRed }}
      onAnimationEnd={onDone}
    >
      {isGain ? '+' : ''}{entry.amount.toLocaleString()} {isGain ? '▲' : '▼'}
    </span>
  );
}

// ─── PlayerPanel ──────────────────────────────────────────────────────────────

export function PlayerPanel({ players, viewerId, createdAt, onSurrender }: PlayerPanelProps) {
  const t = useTranslations('Player');
  const currentPlayer = players.find((player) => player.isActive);
  const sessionTimer  = useSessionTimer(createdAt);
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
      {createdAt && (
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: GAME_BOARD_COLORS.muted }}
          >
            {t('session')}
          </span>
          <span
            className="font-mono text-[10px] font-black tabular-nums"
            style={{ color: GAME_BOARD_COLORS.muted }}
          >
            {sessionTimer}
          </span>
        </div>
      )}

      <div
        className="rounded-[14px] border px-3 py-3"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor: BOARD_TILE_COLORS.propertyBlue,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]">
          {t('currentTurn')}
        </p>
        <p className="mt-1 truncate font-display text-2xl font-semibold">
          {currentPlayer?.name ?? t('waiting')}
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

          const tokenColor = TOKEN_COLORS[player.token];

          return (
            <article
              key={player.id}
              className="grid gap-3 rounded-[14px] px-3 py-3"
              style={{
                backgroundColor: player.isActive ? `${tokenColor}18` : GAME_BOARD_COLORS.surface,
                border: player.isActive
                  ? `2px solid ${tokenColor}`
                  : `1px solid ${GAME_BOARD_COLORS.border}`,
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
                      {t('position', { position: player.position })}
                    </StatusPill>
                    {player.isActive && (
                      <StatusPill backgroundColor={BOARD_TILE_COLORS.propertyBlue}>{t('turn')}</StatusPill>
                    )}
                    {player.inJail && (
                      <StatusPill backgroundColor={jailColor}>
                        {player.jailTurns != null ? t('jailTurns', { turns: player.jailTurns }) : t('jail')}
                      </StatusPill>
                    )}
                    {player.isBankrupt && (
                      <StatusPill backgroundColor={BOARD_TILE_COLORS.railroad}>{t('bankrupt')}</StatusPill>
                    )}
                  </div>

                  {/* Balance row */}
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <p
                      className="font-mono text-base font-black tabular-nums"
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
                    {t('netWorth', { amount: netWorth.toLocaleString() })}
                  </p>
                </div>
              </div>

              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '0.125rem' }}
                aria-label={t('ownedProperties', { name: player.name })}
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
                    {t('noProperties')}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {onSurrender && (
        <button
          type="button"
          onClick={onSurrender}
          className="mt-auto w-full shrink-0 rounded-[10px] border py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-70"
          style={{
            backgroundColor: 'transparent',
            borderColor: BOARD_TILE_COLORS.propertyRed,
            color: BOARD_TILE_COLORS.propertyRed,
          }}
        >
          {t('surrender')}
        </button>
      )}
    </aside>
  );
}
