'use client';

import { cn } from '@/shared/lib/cn';
import { BOARD_TILE_COLORS } from '../game-board.colors';
import { TileEdge } from '../game-board.enums';
import type { BoardPlayer } from '../game-board.types';

interface PlayerMarkerProps {
  edge: TileEdge;
  players?: BoardPlayer[];
}

function getPlayerTokenClass(edge: TileEdge) {
  switch (edge) {
    case TileEdge.BOTTOM:
      return 'bottom-1 left-1/2 -translate-x-1/2';
    case TileEdge.TOP:
      return 'left-1/2 top-1 -translate-x-1/2';
    case TileEdge.LEFT:
      return 'left-1 top-1/2 -translate-y-1/2';
    case TileEdge.RIGHT:
      return 'right-1 top-1/2 -translate-y-1/2';
    default:
      return 'bottom-2 right-2';
  }
}

export function PlayerMarker({ players, edge }: PlayerMarkerProps) {
  if (!players?.length) {
    return null;
  }

  const isCorner = edge === TileEdge.CORNER;

  return (
    <div
      className={cn(
        'absolute z-30 flex max-w-[86%] flex-wrap items-center justify-center gap-[3px]',
        getPlayerTokenClass(edge),
      )}
      aria-label={`${players.length} player token${players.length === 1 ? '' : 's'}`}
    >
      {players.slice(0, 6).map((player) => (
        <span
          key={player.id}
          className="flex items-center justify-center rounded-full border-2 font-mono font-black leading-none"
          style={{
            width: isCorner
              ? 'clamp(24px, calc(var(--board-corner-size) * 0.2), 40px)'
              : 'clamp(22px, calc(var(--board-tile-width) * 0.34), 36px)',
            height: isCorner
              ? 'clamp(24px, calc(var(--board-corner-size) * 0.2), 40px)'
              : 'clamp(22px, calc(var(--board-tile-width) * 0.34), 36px)',
            backgroundColor: player.tokenColor,
            borderColor: BOARD_TILE_COLORS.altText,
            color: BOARD_TILE_COLORS.altText,
            fontSize: isCorner
              ? 'clamp(12px, calc(var(--board-corner-size) * 0.09), 18px)'
              : 'clamp(11px, calc(var(--board-tile-width) * 0.16), 16px)',
            boxShadow: '0 1px 3px rgba(0,0,0,.28)',
          }}
        >
          {player.id.replace(/\D/g, '') || player.id.slice(0, 1).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
