'use client';

import type { PropertyState } from '@/shared/protocol/game-state';
import { TileEdge } from '../game-board.enums';

interface BuildingsMarkerProps {
  edge: TileEdge;
  ownership?: PropertyState | null;
}

// ─── Colors ────────────────────────────────────────────────────────────────────
const HOUSE_BG = '#1A6B3A';
const HOTEL_BG = '#8B2020';

// ─── Sizing ────────────────────────────────────────────────────────────────────
// vmin sidesteps the CSS custom-property percentage-context issue.
const W_HOUSE = 'clamp(15px, 0.80vmin, 15px)';
const H_HOUSE = 'clamp(15px, 1.10vmin, 16px)';
const W_HOTEL = 'clamp(15px, 1.20vmin, 17px)';
const H_HOTEL = 'clamp(15px, 1.20vmin, 17px)';

// ─── Band geometry ─────────────────────────────────────────────────────────────
// Must match BoardTile's PROPERTY_HEADER_RATIO (1.25).
const BAND_DEPTH = 'calc(var(--board-edge-depth) * 1.25)';

// Returns a style that covers exactly the same area as the color-band header
// drawn by BoardTile, then flex-centers the building blocks inside it.
function getBandStyle(edge: TileEdge): React.CSSProperties {
  const base: React.CSSProperties = {
    position:       'absolute',
    zIndex:         20,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '2px',
  };

  switch (edge) {
    case TileEdge.BOTTOM:
      return { ...base, top: 0, left: 0, right: 0, height: BAND_DEPTH, flexDirection: 'row' };
    case TileEdge.TOP:
      return { ...base, bottom: 0, left: 0, right: 0, height: BAND_DEPTH, flexDirection: 'row' };
    case TileEdge.LEFT:
      return { ...base, right: 0, top: 0, bottom: 0, width: BAND_DEPTH, flexDirection: 'column' };
    case TileEdge.RIGHT:
      return { ...base, left: 0, top: 0, bottom: 0, width: BAND_DEPTH, flexDirection: 'column' };
    default:
      return { ...base, top: 4, left: 4, flexDirection: 'row' };
  }
}

// ─── Block ─────────────────────────────────────────────────────────────────────
interface BlockProps {
  w: string;
  h: string;
  bg: string;
}

function Block({ w, h, bg }: BlockProps) {
  return (
    <div
      style={{
        width:           w,
        height:          h,
        backgroundColor: bg,
        borderRadius:    '2px',
        borderWidth:     '1.5px',
        borderStyle:     'solid',
        borderColor:     'rgba(255,255,255,0.90)',
        boxShadow:       '0 0 0 1px rgba(0,0,0,0.36), 0 1.5px 4px rgba(0,0,0,0.58)',
        flexShrink:      0,
      }}
    />
  );
}

// ─── BuildingsMarker ──────────────────────────────────────────────────────────

export function BuildingsMarker({ ownership, edge }: BuildingsMarkerProps) {
  if (!ownership || (!ownership.hotel && ownership.houses === 0)) return null;

  return (
    <div
      style={getBandStyle(edge)}
      aria-label={ownership.hotel ? 'Hotel' : `${ownership.houses} house${ownership.houses === 1 ? '' : 's'}`}
    >
      {ownership.hotel ? (
        <Block w={W_HOTEL} h={H_HOTEL} bg={HOTEL_BG} />
      ) : (
        Array.from({ length: ownership.houses }).map((_, i) => (
          <Block key={i} w={W_HOUSE} h={H_HOUSE} bg={HOUSE_BG} />
        ))
      )}
    </div>
  );
}
