import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { Player } from '@/features/player-panel';
import type { PropertyState } from '@/shared/protocol/game-state';
import { RatingBadge } from '@/shared/ui/RatingBadge';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { BOARD } from '@/shared/config/board-layout';
import { mortgageValue, buildingCost } from '@/shared/protocol/board-data';
import { useBalanceChange } from '@/shared/hooks/useBalanceChange';
import { CornerVariant } from '../game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor } from '../game-board.colors';
import { TokenShape } from '../token-shapes';
import { TokenShapeSvg } from './TokenShapeSvg';

// Buyable positions sorted by group — 28 total, laid out as a 7×4 rectangle.
// Only the layout/order is hardcoded; each cell's colour is derived from BOARD
// so it can never drift from the actual tile colours (getSpaceHeaderColor).
const SORTED_BUYABLE_POSITIONS: number[] = [
  1, 3,                 // brown
  6, 8, 9,              // cyan
  11, 13, 14,           // pink
  16, 18, 19,           // orange
  21, 23, 24,           // red
  26, 27, 29,           // yellow
  31, 32, 34,           // green
  37, 39,               // blue
  5, 15, 25, 35,        // railroads
  12, 28,               // utilities
];

const SORTED_BUYABLE_SPACES: Array<{ pos: number; color: string }> = SORTED_BUYABLE_POSITIONS.map(
  (pos) => {
    const space = BOARD.find((boardSpace) => boardSpace.pos === pos);
    return { pos, color: space ? getSpaceHeaderColor(space) : GAME_BOARD_COLORS.border };
  },
);

interface PlayerPanelProps {
  players:     Player[];
  spaces?:     PropertyState[];
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
    const startMs = new Date(createdAt).getTime();
    const id = setInterval(() => setElapsed(Date.now() - startMs), 1000);
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
  // Render the player's actual board token silhouette (avatar clipped to the
  // shape when present) so the panel mirrors what's on the board.
  return (
    <TokenShapeSvg
      shape={player.tokenShape ?? TokenShape.CIRCLE}
      color={TOKEN_COLORS[player.token]}
      avatarUrl={player.avatarUrl}
      size="40px"
      className="shrink-0"
    />
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

function PropertyGroupGrid({ ownedPositions }: { ownedPositions: number[] }) {
  const owned = new Set(ownedPositions);
  return (
    <div
      className="shrink-0"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 8px)', gap: '2px' }}
    >
      {SORTED_BUYABLE_SPACES.map(({ pos, color }) => (
        <span
          key={pos}
          className="block rounded-[2px]"
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: owned.has(pos) ? color : GAME_BOARD_COLORS.border,
          }}
        />
      ))}
    </div>
  );
}

// ─── PlayerPanel ──────────────────────────────────────────────────────────────

export function PlayerPanel({ players, spaces, createdAt, onSurrender }: PlayerPanelProps) {
  const t = useTranslations('Player');
  const currentPlayer = players.find((player) => player.isActive);
  const sessionTimer  = useSessionTimer(createdAt);
  const jailSpace = BOARD.find((space) => space.corner === CornerVariant.JAIL);
  const jailColor = jailSpace ? getSpaceHeaderColor(jailSpace) : BOARD_TILE_COLORS.propertyOrange;
  const [surrenderConfirming, setSurrenderConfirming] = useState(false);

  useEffect(() => {
    if (!surrenderConfirming) return;
    const timer = setTimeout(() => setSurrenderConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [surrenderConfirming]);

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
          const spaceState = new Map((spaces ?? []).map((s) => [s.position, s]));
          const netWorth = player.balance + ownedProperties.reduce((sum, prop) => {
            const state = spaceState.get(prop.pos);
            if (state?.isMortgaged) return sum + mortgageValue(prop.pos);
            const price = (prop as { price?: number }).price ?? 0;
            const buildings = state
              ? (state.hotel ? buildingCost(prop.pos) * 5 : buildingCost(prop.pos) * state.houses)
              : 0;
            return sum + price + buildings;
          }, 0);

          const tokenColor = TOKEN_COLORS[player.token];

          return (
            <article
              key={player.id}
              className="flex items-center gap-2 rounded-[14px] px-3 py-2"
              style={{
                backgroundColor: player.isActive ? `${tokenColor}18` : GAME_BOARD_COLORS.surface,
                border: player.isActive
                  ? `2px solid ${tokenColor}`
                  : `1px solid ${GAME_BOARD_COLORS.border}`,
                color: GAME_BOARD_COLORS.text,
              }}
            >
              <PlayerAvatar player={player} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <p className="min-w-0 truncate font-display text-base font-semibold leading-tight">
                    {player.name}
                  </p>
                  <RatingBadge rating={player.rating} />
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

                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <p
                    className="font-mono text-sm font-black tabular-nums"
                    style={{ color: GAME_BOARD_COLORS.text }}
                  >
                    ${player.balance.toLocaleString()}
                  </p>
                  {delta && (
                    <BalanceDelta key={delta.id} entry={delta} onDone={() => clearDelta(player.id)} />
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-1">
                <PropertyGroupGrid ownedPositions={player.ownedPositions} />
                <p className="font-mono text-[10px] tabular-nums" style={{ color: GAME_BOARD_COLORS.muted }}>
                  {t('netWorth', { amount: netWorth.toLocaleString() })}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {onSurrender && (
        <button
          type="button"
          onClick={() => {
            if (surrenderConfirming) {
              onSurrender();
              setSurrenderConfirming(false);
            } else {
              setSurrenderConfirming(true);
            }
          }}
          className="mt-auto w-full shrink-0 rounded-[10px] border py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] transition-colors"
          style={{
            backgroundColor: surrenderConfirming ? BOARD_TILE_COLORS.propertyRed : 'transparent',
            borderColor: BOARD_TILE_COLORS.propertyRed,
            color: surrenderConfirming ? '#fff' : BOARD_TILE_COLORS.propertyRed,
          }}
        >
          {surrenderConfirming ? t('surrenderConfirm') : t('surrender')}
        </button>
      )}
    </aside>
  );
}
