'use client';

import type { PropertyState } from '@/shared/protocol/game-state';
import { cn } from '@/shared/lib/cn';
import { BOARD_TILE_COLORS } from '../game-board.colors';
import { TileEdge } from '../game-board.enums';

interface BuildingsMarkerProps {
  edge: TileEdge;
  ownership?: PropertyState | null;
}

function getBuildingMarkerClass(edge: TileEdge) {
  switch (edge) {
    case TileEdge.BOTTOM:
      return 'left-1/2 top-1 -translate-x-1/2';
    case TileEdge.TOP:
      return 'bottom-1 left-1/2 -translate-x-1/2';
    case TileEdge.LEFT:
      return 'right-1 top-1/2 -translate-y-1/2 flex-col';
    case TileEdge.RIGHT:
      return 'left-1 top-1/2 -translate-y-1/2 flex-col';
    default:
      return 'left-1 top-1';
  }
}

export function BuildingsMarker({ ownership, edge }: BuildingsMarkerProps) {
  if (!ownership || (!ownership.hotel && ownership.houses === 0)) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute z-20 flex items-center justify-center gap-[2px] rounded-[6px] px-[2px]',
        getBuildingMarkerClass(edge),
      )}
      aria-label={ownership.hotel ? 'Hotel' : `${ownership.houses} houses`}
    >
      {ownership.hotel ? (
        <span
          className="leading-none"
          style={{
            fontSize: 'clamp(18px, calc(var(--board-tile-width) * 0.28), 28px)',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.7)) drop-shadow(0 0 3px rgba(255,255,255,.75))',
          }}
        >
          🏨
        </span>
      ) : (
        Array.from({ length: ownership.houses }).map((_, index) => (
          <span
            key={index}
            className="leading-none"
            style={{
              fontSize: 'clamp(14px, calc(var(--board-tile-width) * 0.22), 22px)',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.68)) drop-shadow(0 0 3px rgba(255,255,255,.7))',
            }}
          >
            🏠
          </span>
        ))
      )}
    </div>
  );
}
