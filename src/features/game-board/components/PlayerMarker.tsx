'use client';

import { cn } from '@/shared/lib/cn';
import { TileEdge } from '../game-board.enums';
import type { BoardPlayer } from '../game-board.types';

interface PlayerMarkerProps {
  edge: TileEdge;
  players?: BoardPlayer[];
}

// ─── Sizing ────────────────────────────────────────────────────────────────────
// vmin scales with the viewport's smaller dimension, which approximates the
// board size at typical screen ratios without the % / CSS-variable nesting issue.
//
// Single token: ~38px on a 1080p screen, ~30px on a small laptop.
// Multi token:  scale to ~65% so two tokens still fit across a single tile.
const DIAMETER_SINGLE = 'clamp(28px, 3.2vmin, 46px)';
const DIAMETER_MULTI  = 'clamp(20px, 2.2vmin, 32px)';
const FONT_SINGLE     = 'clamp(10px, 1.1vmin, 16px)';
const FONT_MULTI      = 'clamp(7px,  0.8vmin, 11px)';

// ─── Anchor positions ──────────────────────────────────────────────────────────
// Each anchor puts tokens on the OPPOSITE side from the color-band header,
// so they never fight for visual space with the property indicator.
//
//  BOTTOM tile → band at top   → tokens at bottom
//  TOP    tile → band at bottom → tokens at top
//  LEFT   tile → band at right  → tokens at left
//  RIGHT  tile → band at left   → tokens at right
//  CORNER      → no band        → bottom-right corner
const ANCHOR: Record<TileEdge, string> = {
  [TileEdge.BOTTOM]: 'bottom-[4px] left-1/2 -translate-x-1/2 flex-row',
  [TileEdge.TOP]:    'top-[4px]    left-1/2 -translate-x-1/2 flex-row',
  [TileEdge.LEFT]:   'left-[4px]   top-1/2  -translate-y-1/2 flex-col',
  [TileEdge.RIGHT]:  'right-[4px]  top-1/2  -translate-y-1/2 flex-col',
  [TileEdge.CORNER]: 'bottom-[8px] right-[8px]               flex-row',
};

// ─── Token ─────────────────────────────────────────────────────────────────────
// aspectRatio: '1 / 1' + explicit width only → perfect circle no matter how
// the flex or stacking context resolves height.
interface TokenProps {
  player: BoardPlayer;
  diameter: string;
  fontSize: string;
}

function Token({ player, diameter, fontSize }: TokenProps) {
  const label = player.id.replace(/\D/g, '') || player.id.slice(0, 1).toUpperCase();

  const ring: React.CSSProperties = {
    width:           diameter,
    aspectRatio:     '1 / 1',
    borderRadius:    '50%',
    flexShrink:      0,
    // White inner ring + dark outer ring + drop-shadow.
    // Two-layer approach works on every tile background color.
    outline:         '2px solid rgba(255,255,255,0.96)',
    outlineOffset:   '0px',
    boxShadow:       '0 0 0 1.5px rgba(0,0,0,0.45), 0 3px 9px rgba(0,0,0,0.65)',
  };

  if (player.avatarUrl) {
    return (
      <img
        src={player.avatarUrl}
        alt={label}
        style={{ ...ring, objectFit: 'cover', display: 'block', backgroundColor: player.tokenColor }}
      />
    );
  }

  return (
    <span
      style={{
        ...ring,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: player.tokenColor,
        color:           'rgba(255,255,255,0.97)',
        fontSize,
        fontFamily:      'var(--font-dm-mono, monospace)',
        fontWeight:      900,
        lineHeight:      1,
        textShadow:      '0 1px 3px rgba(0,0,0,0.70)',
        letterSpacing:   '-0.02em',
        userSelect:      'none',
      }}
    >
      {label}
    </span>
  );
}

// ─── PlayerMarker ─────────────────────────────────────────────────────────────

export function PlayerMarker({ players, edge }: PlayerMarkerProps) {
  if (!players?.length) return null;

  const many      = players.length > 1;
  const diameter  = many ? DIAMETER_MULTI  : DIAMETER_SINGLE;
  const fontSize  = many ? FONT_MULTI      : FONT_SINGLE;

  return (
    <div
      className={cn(
        'absolute z-30 flex flex-wrap items-center justify-center',
        many ? 'gap-[3px]' : '',
        ANCHOR[edge],
      )}
      style={{ maxWidth: '92%', maxHeight: '92%' }}
      aria-label={`${players.length} player token${players.length === 1 ? '' : 's'}`}
    >
      {players.slice(0, 6).map((player) => (
        <Token key={player.id} player={player} diameter={diameter} fontSize={fontSize} />
      ))}
    </div>
  );
}
