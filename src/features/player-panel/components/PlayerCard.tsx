import { useTranslations } from 'next-intl';
import type { PropertyState } from '@/shared/protocol/game-state';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { NORMAL_BOARD_CONFIG } from '@/shared/config/board-layout';
import { mortgageValue, buildingCost } from '@/shared/protocol/board-data';
import { RatingBadge } from '@/shared/ui/RatingBadge';
import { BOARD_TILE_COLORS, getSpaceHeaderColor } from '@/features/BoardTile/boardTile.colors';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import type { Player } from '../player-panel.schema';
import type { BalanceDeltaEntry } from './BalanceDelta';
import { PlayerAvatar } from './PlayerAvatar';
import { StatusPill } from './StatusPill';
import { BalanceDelta } from './BalanceDelta';
import { PropertyGroupGrid } from './PropertyGroupGrid';

function getPositionPillColor(position: number): string {
  const space = NORMAL_BOARD_CONFIG.spacesByPosition[position];
  return space ? getSpaceHeaderColor(space) : BOARD_TILE_COLORS.propertyBlue;
}

function computeNetWorth(player: Player, spaceState: Map<number, PropertyState>): number {
  return player.balance + player.ownedPositions.reduce((sum, position) => {
    const prop = NORMAL_BOARD_CONFIG.spacesByPosition[position];
    if (!prop) return sum;
    const state = spaceState.get(position);
    if (state?.isMortgaged) return sum + mortgageValue(position);
    const price = (prop as { price?: number }).price ?? 0;
    const buildings = state
      ? (state.hotel ? buildingCost(position) * 5 : buildingCost(position) * state.houses)
      : 0;
    return sum + price + buildings;
  }, 0);
}

interface PlayerCardProps {
  player: Player;
  spaceState: Map<number, PropertyState>;
  jailColor: string;
  delta: BalanceDeltaEntry | undefined;
  onClearDelta: () => void;
}

export function PlayerCard({ player, spaceState, jailColor, delta, onClearDelta }: PlayerCardProps) {
  const t = useTranslations('Player');
  const tokenColor = TOKEN_COLORS[player.token];
  const netWorth = computeNetWorth(player, spaceState);

  return (
    <article
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
            <BalanceDelta key={delta.id} entry={delta} onDone={onClearDelta} />
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
}
