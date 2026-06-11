'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { TileEdge } from '../boardTile.enums';
import type { BoardPlayer } from '../boardTile.schema';
import { TokenShapeSvg } from './TokenShapeSvg';

interface PlayerMarkerProps {
  edge:             TileEdge;
  players?:         BoardPlayer[];
  walkingPlayerIds?: Set<string>;
}

// Single token: ~38px on 1080p, ~30px on a small laptop.
// Multi token: scale to ~65% so two tokens still fit across one tile.
const DIAMETER_SINGLE = 'clamp(28px, 3.2vmin, 46px)';
const DIAMETER_MULTI  = 'clamp(20px, 2.2vmin, 32px)';

// Tokens sit on the opposite side from the color-band header.
const ANCHOR: Record<TileEdge, string> = {
  [TileEdge.BOTTOM]: 'bottom-[4px] left-1/2 -translate-x-1/2 flex-row',
  [TileEdge.TOP]:    'top-[4px]    left-1/2 -translate-x-1/2 flex-row',
  [TileEdge.LEFT]:   'left-[4px]   top-1/2  -translate-y-1/2 flex-col',
  [TileEdge.RIGHT]:  'right-[4px]  top-1/2  -translate-y-1/2 flex-col',
  [TileEdge.CORNER]: 'bottom-[8px] right-[8px]               flex-row',
};

export function PlayerMarker({ players, edge, walkingPlayerIds }: PlayerMarkerProps) {
  const t = useTranslations('Player');
  if (!players?.length) return null;

  const many     = players.length > 1;
  const diameter = many ? DIAMETER_MULTI : DIAMETER_SINGLE;

  return (
    <div
      className={cn('absolute z-[47] flex flex-wrap items-center justify-center', many ? 'gap-[3px]' : '', ANCHOR[edge])}
      style={{ maxWidth: '92%', maxHeight: '92%' }}
      aria-label={t('tokenCount', { count: players.length })}
    >
      {players.slice(0, 6).map((player) => {
        const isWalking = walkingPlayerIds?.has(player.id) ?? false;
        return (
          // key includes position so React remounts on each step → animation re-fires
          <TokenShapeSvg
            key={isWalking ? `${player.id}-${player.position}` : player.id}
            shape={player.tokenShape}
            color={player.tokenColor}
            avatarUrl={player.avatarUrl}
            size={diameter}
            className={isWalking ? 'token-walking' : undefined}
          />
        );
      })}
    </div>
  );
}
