'use client';

import { useState, useEffect, useRef } from 'react';
import { BOARD, getGridPos, getTileEdge } from '@/shared/config/board-layout';
import { BoardTileFlavor, SpaceType } from '@/features/game-board/game-board.enums';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { BoardTile } from '@/features/game-board/components/BoardTile';
import type { BoardPlayer } from '@/features/game-board/game-board.types';
import { TokenShape } from '@/features/game-board/token-shapes';
import type { PropertyState } from '@/shared/protocol/game-state';
import { WALK_STEP_DURATION_MS, CARD_WALK_STEP_DURATION_MS, JAIL_CORNER_DRAG_DURATION_MS } from '@/shared/config/constants';

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

const OUTER_MARGIN = 0.35;

function getTileOuterEdgePct(pos: number): { x: number; y: number } {
  const { col, row } = getGridPos(pos);

  const cx = col === 0 ? 1 : col === 10 ? 12 : col + 1.5;
  const cy = row === 0 ? 1 : row === 10 ? 12 : row + 1.5;

  const lo = OUTER_MARGIN;
  const hi = 13 - OUTER_MARGIN;

  let x: number;
  let y: number;

  if      (col === 10 && row === 10) { x = hi; y = hi; }
  else if (col === 0  && row === 10) { x = lo; y = hi; }
  else if (col === 0  && row === 0 ) { x = lo; y = lo; }
  else if (col === 10 && row === 0 ) { x = hi; y = lo; }
  else if (row === 10) { x = cx; y = hi; }
  else if (col === 0 ) { x = lo; y = cy; }
  else if (row === 0 ) { x = cx; y = lo; }
  else                 { x = hi; y = cy; }

  return { x: (x / 13) * 100, y: (y / 13) * 100 };
}

// ─── Animation constants ──────────────────────────────────────────────────────

type AnimVariant = 'normal' | 'fast' | 'drag';

const ANIM_CONFIG: Record<AnimVariant, { easing: string; duration: number }> = {
  normal: { easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)', duration: WALK_STEP_DURATION_MS },
  fast:   { easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)', duration: CARD_WALK_STEP_DURATION_MS },
  drag:   { easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)',    duration: JAIL_CORNER_DRAG_DURATION_MS },
};

// ─── Static board state ───────────────────────────────────────────────────────

function houses(position: number): PropertyState {
  return { position, ownerId: null, houses: 4, hotel: false, isMortgaged: false };
}

function mortgaged(position: number): PropertyState {
  return { position, ownerId: 'p1', houses: 0, hotel: false, isMortgaged: true };
}

const STATIC_OWNERSHIP = new Map<number, PropertyState>([
  [2,  houses(2)],
  [18, houses(18)],
  [23, houses(23)],
  [39, houses(39)],
  [5,  mortgaged(5)],
  [12, mortgaged(12)],
]);

const STATIC_PLAYERS = new Map<number, BoardPlayer[]>([
  [0,  [{ id: 'still-a', position: 0,  tokenColor: '#F59E0B', tokenShape: TokenShape.SUNNY,    isBankrupt: false }]],
  [20, [{ id: 'still-b', position: 20, tokenColor: '#A855F7', tokenShape: TokenShape.GHOSTISH, isBankrupt: false }]],
]);

// ─── Walk mode: continuous loop ───────────────────────────────────────────────

const WALK_TOKENS = [
  { id: 'dbg-green', tokenColor: '#22C55E' },
];

const WALK_START = [0];

const WALK_SPEEDS = [
  { label: '½×', ms: 1200 },
  { label: '1×', ms: 600  },
  { label: '2×', ms: 300  },
  { label: '4×', ms: 150  },
];

// ─── Animated token ───────────────────────────────────────────────────────────

interface AnimatedTokenProps {
  tokenColor: string;
  pos:        number;
  variant:    AnimVariant;
  isDrag?:    boolean;
}

function AnimatedToken({ tokenColor, pos, variant }: AnimatedTokenProps) {
  const prevPosRef            = useRef(pos);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const prev  = prevPosRef.current;
    const delta = Math.abs(pos - prev);
    // Drag is always an intentional teleport — never suppress it
    if (variant !== 'drag' && delta > 20) {
      setAnimate(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(true);
    }
    prevPosRef.current = pos;
  }, [pos, variant]);

  const { x, y } = getTileOuterEdgePct(pos);
  const { easing, duration } = ANIM_CONFIG[variant];

  return (
    <div
      aria-hidden="true"
      style={{
        position:        'absolute',
        left:            `${x}%`,
        top:             `${y}%`,
        transform:       'translate(-50%, -50%)',
        transition:      animate
          ? `left ${duration}ms ${easing}, top ${duration}ms ${easing}`
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

// ─── Scenario script runner ───────────────────────────────────────────────────

interface ScriptStep {
  pos:        number;
  variant:    AnimVariant;
  holdMs:     number; // time to wait after this step before advancing
}

interface ScriptState {
  pos:     number;
  variant: AnimVariant;
}

function useScript(steps: ScriptStep[], active: boolean): ScriptState {
  const initialState = { pos: steps[0].pos, variant: steps[0].variant };
  const [state, setState] = useState<ScriptState>(initialState);
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef         = useRef(active);
  const stepIdxRef        = useRef(0);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      stepIdxRef.current = 0;
      return;
    }

    function advance() {
      if (!activeRef.current) return;
      const idx  = stepIdxRef.current % steps.length;
      const step = steps[idx];
      setState({ pos: step.pos, variant: step.variant });
      stepIdxRef.current++;
      timerRef.current = setTimeout(advance, step.holdMs);
    }

    advance();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return active ? state : initialState;
}

// ─── Jail scenario: red token walks to pos 30, then drags to pos 10 ──────────

const JAIL_STEPS: ScriptStep[] = [
  // Walk clockwise from 24 toward GOTO_JAIL (pos 30)
  { pos: 25, variant: 'normal', holdMs: WALK_STEP_DURATION_MS + 60 },
  { pos: 26, variant: 'normal', holdMs: WALK_STEP_DURATION_MS + 60 },
  { pos: 27, variant: 'normal', holdMs: WALK_STEP_DURATION_MS + 60 },
  { pos: 28, variant: 'normal', holdMs: WALK_STEP_DURATION_MS + 60 },
  { pos: 29, variant: 'normal', holdMs: WALK_STEP_DURATION_MS + 60 },
  // Land on GOTO_JAIL – pause before the drag
  { pos: 30, variant: 'normal', holdMs: 700 },
  // Drag to JAIL corner (pos 10) – hold before repeating
  { pos: 10, variant: 'drag', holdMs: JAIL_CORNER_DRAG_DURATION_MS + 1400 },
  // Teleport back to start (no transition needed – next step will be pos 25)
  { pos: 24, variant: 'normal', holdMs: 60 },
];

// ─── Card scenario: blue token zips fast from pos 7 toward pos 20 ────────────

const CARD_STEPS: ScriptStep[] = [
  { pos: 8,  variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 9,  variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 10, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 11, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 12, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 13, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 14, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 15, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 16, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 17, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 18, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  { pos: 19, variant: 'fast', holdMs: CARD_WALK_STEP_DURATION_MS + 40 },
  // Destination – hold before reset
  { pos: 20, variant: 'fast', holdMs: 1200 },
  // Teleport back to chance tile
  { pos: 7,  variant: 'fast', holdMs: 200 },
];

// ─── Mode ────────────────────────────────────────────────────────────────────

type Mode = 'walk' | 'jail' | 'card';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebugPage() {
  const [mode, setMode]         = useState<Mode>('walk');
  const [tick, setTick]         = useState(0);
  const [playing, setPlaying]   = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);

  const { ms } = WALK_SPEEDS[speedIdx];

  useEffect(() => {
    if (mode !== 'walk' || !playing) return;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [mode, playing, ms]);

  const walkPositions = WALK_TOKENS.map((_, i) => (tick + WALK_START[i]) % 40);

  const jailState = useScript(JAIL_STEPS, mode === 'jail');
  const cardState = useScript(CARD_STEPS, mode === 'card');

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
              ['--board-unit' as string]:        'calc((100% - 24px) / 13)',
              ['--board-tile-width' as string]:  'var(--board-unit)',
              ['--board-corner-size' as string]: 'calc(var(--board-unit) * 2)',
              ['--board-edge-depth' as string]:  'calc(var(--board-unit) * 2)',
              gridTemplateColumns: BOARD_COLUMNS,
              gridTemplateRows:    BOARD_ROWS,
              gap:                 '2px',
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
                    ownership={STATIC_OWNERSHIP.get(space.pos) ?? null}
                    players={STATIC_PLAYERS.get(space.pos) ?? []}
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

            {/* Walk mode – green token loops continuously */}
            {mode === 'walk' && WALK_TOKENS.map((token, i) => (
              <AnimatedToken
                key={token.id}
                tokenColor={token.tokenColor}
                pos={walkPositions[i]}
                variant="normal"
              />
            ))}

            {/* Jail scenario – red token */}
            {mode === 'jail' && (
              <AnimatedToken
                tokenColor="#EF4444"
                pos={jailState.pos}
                variant={jailState.variant}
              />
            )}

            {/* Card scenario – blue token */}
            {mode === 'card' && (
              <AnimatedToken
                tokenColor="#3B82F6"
                pos={cardState.pos}
                variant={cardState.variant}
              />
            )}
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
        {/* Mode selector */}
        <div className="flex gap-1">
          {([
            { id: 'walk', label: '🔄 Walk',  color: '#22C55E' },
            { id: 'jail', label: '🚨 Jail',  color: '#EF4444' },
            { id: 'card', label: '⚡ Card',  color: '#3B82F6' },
          ] as const).map((m) => (
            <button
              key={m.id}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors active:scale-95"
              style={{
                backgroundColor: mode === m.id ? `${m.color}28` : 'transparent',
                color:           mode === m.id ? m.color        : 'rgba(255,255,255,0.40)',
                border:          mode === m.id ? `1px solid ${m.color}60` : '1px solid transparent',
              }}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/20" />

        {/* Walk controls — only relevant in walk mode */}
        {mode === 'walk' && (
          <>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-white transition-colors hover:bg-white/10 active:scale-95"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? '⏸' : '▶'}
            </button>

            <div className="h-4 w-px bg-white/20" />

            <div className="flex gap-1">
              {WALK_SPEEDS.map((s, i) => (
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
          </>
        )}

        {/* Scenario info badge */}
        {mode === 'jail' && (
          <span className="text-xs text-[#EF4444]/80 font-mono">
            pos 24 → 30 <span className="opacity-50">walk</span> → 10 <span className="opacity-50">drag</span>
          </span>
        )}
        {mode === 'card' && (
          <span className="text-xs text-[#3B82F6]/80 font-mono">
            pos 7 → 20 <span className="opacity-50">fast</span>
          </span>
        )}

        <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">
          debug
        </span>
      </div>
    </div>
  );
}
