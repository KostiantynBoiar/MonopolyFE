'use client';

import { BoardTileSelectionTone } from '../../game-board.enums';
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
              boxShadow: `inset 0 0 10px 2px rgba(228,192,106,0.55)`,
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3px] z-[51]"
            style={{
              borderRadius: 'inherit',
              boxShadow: `inset 0 0 0 clamp(2px, 0.35vmin, 4px) ${BOARD_TILE_COLORS.propertyYellow}`,
            }}
          />
        </>
      )}
    </>
  );
}
