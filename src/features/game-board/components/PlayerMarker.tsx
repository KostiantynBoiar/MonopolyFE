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
  const hasMultiple = players.length > 1;
  
  // Scale down when multiple markers are present
  const sizeScale = hasMultiple ? 0.65 : 1;

  return (
    <div
      className={cn(
        'absolute z-30 flex max-w-[86%] flex-wrap items-center justify-center',
        hasMultiple ? 'gap-[2px]' : 'gap-[3px]',
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
              ? `clamp(${72 * sizeScale}px, calc(var(--board-corner-size) * ${0.6 * sizeScale}), ${120 * sizeScale}px)`
              : `clamp(${66 * sizeScale}px, calc(var(--board-tile-width) * ${1.02 * sizeScale}), ${108 * sizeScale}px)`,
            height: isCorner
              ? `clamp(${72 * sizeScale}px, calc(var(--board-corner-size) * ${0.6 * sizeScale}), ${120 * sizeScale}px)`
              : `clamp(${66 * sizeScale}px, calc(var(--board-tile-width) * ${1.02 * sizeScale}), ${108 * sizeScale}px)`,
            backgroundColor: player.tokenColor,
            borderColor: BOARD_TILE_COLORS.altText,
            color: BOARD_TILE_COLORS.altText,
            fontSize: isCorner
              ? `clamp(${36 * sizeScale}px, calc(var(--board-corner-size) * ${0.27 * sizeScale}), ${54 * sizeScale}px)`
              : `clamp(${33 * sizeScale}px, calc(var(--board-tile-width) * ${0.48 * sizeScale}), ${48 * sizeScale}px)`,
            boxShadow: '0 3px 8px rgba(0,0,0,.55), 0 0 0 2px rgba(0,0,0,.25)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))',
            textShadow: '0 -1px 1px rgba(0,0,0,.3)',
          }}
        >
          {player.id.replace(/\D/g, '') || player.id.slice(0, 1).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
