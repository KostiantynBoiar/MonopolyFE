'use client';

import { useState, useEffect, useRef } from 'react';
import { BOARD, getGridPos, getTileEdge } from '@/shared/config/board-layout';
import { BoardTileFlavor, SpaceType } from '@/features/game-board/game-board.enums';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { BoardTile } from '@/features/game-board/components/BoardTile';

// ─── Board layout helpers ─────────────────────────────────────────────────────

const BOARD_COLUMNS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';
const BOARD_ROWS    = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';

function getTileFlavor(type: SpaceType): BoardTileFlavor {
  switch (type) {
    case SpaceType.CORNER: return BoardTileFlavor.CORNER;
    case SpaceType.CHANCE:
    case SpaceType.CHEST:  return BoardTileFlavor.SPECIAL;
    default:               return BoardTileFlavor.PROPERTY;
  }
}

// The rendered board is a 13×13 equal-unit grid (aspect-square).
// Corner tiles span 2 units, regular tiles 1 unit.
//
// Tokens walk the outer perimeter: for each edge group the position is fixed
// to the outer side of that edge while the other axis tracks the tile's centre.
// OUTER_MARGIN is the distance (in grid units) the token centre sits inside
// the board border — roughly matching PlayerMarker's `bottom/left-[4px]` offset.
const OUTER_MARGIN = 0.35; // units inward from the board's outer border

function getTileOuterEdgePct(pos: number): { x: number; y: number } {
  const { col, row } = getGridPos(pos);

  // Horizontal / vertical midpoint of this tile column / row (13-unit space)
  const cx = col === 0 ? 1 : col === 10 ? 12 : col + 1.5;
  const cy = row === 0 ? 1 : row === 10 ? 12 : row + 1.5;

  const lo = OUTER_MARGIN;        // near the 0 edge  (left / top)
  const hi = 13 - OUTER_MARGIN;   // near the 13 edge (right / bottom)

  let x: number;
  let y: number;

  // Corners sit at the intersection of their two outer edges
  if      (col === 10 && row === 10) { x = hi; y = hi; } // pos  0 – GO
  else if (col === 0  && row === 10) { x = lo; y = hi; } // pos 10 – JAIL
  else if (col === 0  && row === 0 ) { x = lo; y = lo; } // pos 20 – PARKING
  else if (col === 10 && row === 0 ) { x = hi; y = lo; } // pos 30 – GOTO JAIL
  // Regular edges: one axis = outer border, other = tile centre
  else if (row === 10) { x = cx; y = hi; } // bottom row
  else if (col === 0 ) { x = lo; y = cy; } // left column
  else if (row === 0 ) { x = cx; y = lo; } // top row
  else                 { x = hi; y = cy; } // right column

  return { x: (x / 13) * 100, y: (y / 13) * 100 };
}

// ─── Animation constants ──────────────────────────────────────────────────────

const EASING   = 'cubic-bezier(0.38, 1.21, 0.22, 1.00)';
const DURATION = 500; // ms

// ─── Token definitions ────────────────────────────────────────────────────────

const TOKENS = [
  { id: 'dbg-red',   tokenColor: '#EF4444' },
  { id: 'dbg-blue',  tokenColor: '#3B82F6' },
  { id: 'dbg-green', tokenColor: '#22C55E' },
];

const START_OFFSETS = [0, 13, 27];

const SPEEDS = [
  { label: '½×', ms: 1200 },
  { label: '1×', ms: 600  },
  { label: '2×', ms: 300  },
  { label: '4×', ms: 150  },
];

// ─── Animated token ───────────────────────────────────────────────────────────
// Absolutely positioned over the board grid; transitions left/top on pos change.
// Wrapping from pos 39 → 0 disables the transition for one paint cycle so the
// token teleports rather than flying across the entire board.

interface AnimatedTokenProps {
  tokenColor: string;
  pos:        number;
}

function AnimatedToken({ tokenColor, pos }: AnimatedTokenProps) {
  const prevPosRef          = useRef(pos);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const prev  = prevPosRef.current;
    const delta = Math.abs(pos - prev);

    if (delta > 20) {
      // Wraparound jump — teleport without transition, then re-enable
      setAnimate(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setAnimate(true);
        }),
      );
    } else {
      setAnimate(true);
    }
    prevPosRef.current = pos;
  }, [pos]);

  const { x, y } = getTileOuterEdgePct(pos);

  return (
    <div
      aria-hidden="true"
      style={{
        position:        'absolute',
        left:            `${x}%`,
        top:             `${y}%`,
        transform:       'translate(-50%, -50%)',
        transition:      animate
          ? `left ${DURATION}ms ${EASING}, top ${DURATION}ms ${EASING}`
          : 'none',
        width:           'clamp(20px, 2.6vmin, 38px)',
        aspectRatio:     '1 / 1',
        borderRadius:    '50%',
        backgroundColor: tokenColor,
        outline:         '2.5px solid rgba(255,255,255,0.94)',
        outlineOffset:   '0px',
        boxShadow:       '0 0 0 1.5px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.65)',
        zIndex:          60,
        pointerEvents:   'none',
        willChange:      'left, top',
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebugPage() {
  const [tick, setTick]         = useState(0);
  const [playing, setPlaying]   = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);

  const ms = SPEEDS[speedIdx].ms;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [playing, ms]);

  const positions = TOKENS.map((_, i) => (tick + START_OFFSETS[i]) % 40);

  return (
    <div
      className="flex h-screen w-full items-center justify-center p-[4px]"
      style={{ backgroundColor: GAME_BOARD_COLORS.ink }}
    >
      {/* Board area */}
      <div className="flex min-h-0 min-w-0 h-full w-full items-center justify-center overflow-hidden">
        <div className="aspect-square h-full max-h-full w-full max-w-full">

          {/* Grid + overlay in one relative container */}
          <div
            className="relative grid h-full w-full"
            style={{
              ['--board-unit' as string]:        'calc(100% / 13)',
              ['--board-tile-width' as string]:  'var(--board-unit)',
              ['--board-corner-size' as string]: 'calc(var(--board-unit) * 2)',
              ['--board-edge-depth' as string]:  'calc(var(--board-unit) * 2)',
              gridTemplateColumns: BOARD_COLUMNS,
              gridTemplateRows:    BOARD_ROWS,
              backgroundColor:     GAME_BOARD_COLORS.ink,
            }}
          >
            {/* Tiles */}
            {BOARD.map((space) => {
              const { col, row } = getGridPos(space.pos);
              return (
                <div key={space.pos} style={{ gridColumn: col + 1, gridRow: row + 1 }}>
                  <BoardTile
                    space={space}
                    edge={getTileEdge(space.pos)}
                    flavor={getTileFlavor(space.type)}
                    ownership={null}
                  />
                </div>
              );
            })}

            {/* Board center */}
            <div
              style={{
                gridColumn:      '2 / 11',
                gridRow:         '2 / 11',
                margin:          '4px',
                borderRadius:    '16px',
                border:          `1px solid ${GAME_BOARD_COLORS.center}`,
                backgroundColor: GAME_BOARD_COLORS.center,
              }}
            />

            {/* Token overlay — absolutely positioned over the grid */}
            {TOKENS.map((token, i) => (
              <AnimatedToken
                key={token.id}
                tokenColor={token.tokenColor}
                pos={positions[i]}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ── Floating HUD ────────────────────────────────────────────────────── */}
      <div
        className="fixed top-3 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-3 rounded-xl px-4 py-2"
        style={{
          backgroundColor: 'rgba(10,14,30,0.92)',
          border:          '1px solid rgba(255,255,255,0.10)',
          backdropFilter:  'blur(10px)',
          boxShadow:       '0 4px 24px rgba(0,0,0,0.55)',
        }}
      >
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-white transition-colors hover:bg-white/10 active:scale-95"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="h-4 w-px bg-white/20" />

        <div className="flex gap-1">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              className="rounded px-2 py-0.5 text-xs font-mono transition-colors active:scale-95"
              style={{
                backgroundColor: i === speedIdx ? 'rgba(255,255,255,0.15)' : 'transparent',
                color:           i === speedIdx ? '#ffffff'                 : 'rgba(255,255,255,0.40)',
              }}
              onClick={() => setSpeedIdx(i)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/20" />

        <div className="flex gap-3">
          {TOKENS.map((t, i) => (
            <div key={t.id} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.tokenColor }}
              />
              <span
                className="tabular-nums font-mono text-xs"
                style={{ color: t.tokenColor }}
              >
                {positions[i].toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-white/20" />

        <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">
          debug
        </span>
      </div>
    </div>
  );
}
