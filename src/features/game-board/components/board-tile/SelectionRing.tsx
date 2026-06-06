'use client';

import type { BoardTileSelectionTone } from '../../game-board.enums';
import { BOARD_TILE_COLORS } from '../../game-board.colors';
import { SELECTION_RING_COLOR } from './constants';

interface SelectionRingProps {
  selected: boolean;
  tone: BoardTileSelectionTone | null;
}

export function SelectionRing({ selected, tone }: SelectionRingProps) {
  if (!selected && !tone) return null;

  return (
    <>
      {tone && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[50]"
          style={{
            borderRadius: 'inherit',
            boxShadow: `inset 0 0 0 clamp(3px, 0.5vmin, 6px) ${SELECTION_RING_COLOR[tone]}, 0 0 0 1px rgba(16,24,46,0.55)`,
          }}
        />
      )}
      {selected && (
        <>
          {/* Soft inner halo — clipped-safe glow that makes the active tile pop */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[49]"
            style={{
              borderRadius: 'inherit',
              boxShadow: 'inset 0 0 10px 2px rgba(228,192,106,0.55)',
            }}
          />
          {/* Ring flush to the tile edge: a dark hairline at the very border for
              contrast on light tiles, then the gold band just inside it. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[51]"
            style={{
              borderRadius: 'inherit',
              boxShadow: `inset 0 0 0 1.5px rgba(16,24,46,0.7), inset 0 0 0 clamp(3px, 0.55vmin, 6px) ${BOARD_TILE_COLORS.propertyYellow}`,
            }}
          />
        </>
      )}
    </>
  );
}
