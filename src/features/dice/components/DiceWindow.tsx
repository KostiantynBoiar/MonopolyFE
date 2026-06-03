
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { DiceRoll } from '@/shared/protocol/game-state';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { FAST_INTERVAL_MS, FAST_PHASE_MS, SLOW_INTERVAL_MS, DICE_SPIN_MS } from '@/shared/config/constants';

interface DiceWindowProps {
  diceRoll?: DiceRoll | null;
  rollId?: number;
}

const PIP_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

function randomFace() {
  return Math.floor(Math.random() * 6) + 1;
}

const DIE_BG = 'linear-gradient(145deg, rgba(255,255,255,.13) 0%, rgba(0,0,0,.22) 100%)';

function DieFace({
  value,
  tilt,
  rolling,
  justSettled,
  side,
}: {
  value: number;
  tilt: string;
  rolling: boolean;
  justSettled: boolean;
  side: 'left' | 'right';
}) {
  return (
    <div
      className={`monopoly-die relative aspect-square w-full max-w-[72px] rounded-[18px] border${justSettled ? ' die-settled' : ''}`}
      style={{
        ['--die-rest-transform' as string]: tilt,
        animation: rolling
          ? `${side === 'left' ? 'monopoly-die-roll-left' : 'monopoly-die-roll-right'} ${DICE_SPIN_MS}ms cubic-bezier(.16,.84,.28,1)`
          : undefined,
        background: `${DIE_BG}, ${BOARD_TILE_COLORS.propertyRed}`,
        borderColor: 'rgba(255,255,255,0.10)',
        boxShadow: rolling
          ? '0 12px 0 rgba(0,0,0,0.35), 0 20px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)'
          : '0 6px 0 rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)',
        transform: tilt,
      } as CSSProperties}
    >
      {PIP_LAYOUTS[value].map(([row, col], index) => (
        <span
          key={`${value}-${index}`}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            top: `${row * 25}%`,
            left: `${col * 25}%`,
            width: 'clamp(7px, 14%, 11px)',
            height: 'clamp(7px, 14%, 11px)',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 4px rgba(255,255,255,0.6)',
          }}
        />
      ))}
    </div>
  );
}

export function DiceWindow({ diceRoll, rollId = 0 }: DiceWindowProps) {
  const t = useTranslations('Dice');
  const [rolling, setRolling] = useState(false);
  const [justSettled, setJustSettled] = useState(false);
  const die1 = diceRoll?.die1 ?? 1;
  const die2 = diceRoll?.die2 ?? 1;
  const [displayDie1, setDisplayDie1] = useState(die1);
  const [displayDie2, setDisplayDie2] = useState(die2);
  const [settledRoll, setSettledRoll] = useState<DiceRoll>({
    die1,
    die2,
    isDoubles: die1 === die2,
  });
  const total = settledRoll.die1 + settledRoll.die2;
  const isDoubles = settledRoll.isDoubles;

  // Tracks which rollId has already been animated so die1/die2 prop changes
  // (e.g. game state commit after End Turn) don't re-trigger the animation.
  const lastAnimatedRollIdRef = useRef(0);

  useEffect(() => {
    if (rollId === 0) {
      // Late-joiner / initial sync — show current values without animation.
      setDisplayDie1(die1);
      setDisplayDie2(die2);
      setSettledRoll({ die1, die2, isDoubles: die1 === die2 });
      return;
    }

    if (rollId === lastAnimatedRollIdRef.current) {
      // Same roll, die values changed due to game state commit — no re-animation.
      return;
    }

    lastAnimatedRollIdRef.current = rollId;

    // Collect disposables so the cleanup is a single pass.
    const dispose: Array<() => void> = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      dispose.push(() => window.clearTimeout(id));
    };
    const cycle = (fn: () => void, ms: number) => {
      const id = window.setInterval(fn, ms);
      dispose.push(() => window.clearInterval(id));
      return id;
    };

    setRolling(true);
    setJustSettled(false);

    // Phase 1: fast chaotic pip cycling during tumble.
    const fastId = cycle(() => {
      setDisplayDie1(randomFace());
      setDisplayDie2(randomFace());
    }, FAST_INTERVAL_MS);

    // Phase 2: slow down as die decelerates.
    later(() => {
      window.clearInterval(fastId);
      const slowId = cycle(() => {
        setDisplayDie1(randomFace());
        setDisplayDie2(randomFace());
      }, SLOW_INTERVAL_MS);

      // Reveal final values and settle.
      later(() => {
        window.clearInterval(slowId);
        setDisplayDie1(die1);
        setDisplayDie2(die2);
        setSettledRoll({ die1, die2, isDoubles: die1 === die2 });
        setRolling(false);
        setJustSettled(true);
        later(() => setJustSettled(false), 340);
      }, DICE_SPIN_MS - FAST_PHASE_MS);
    }, FAST_PHASE_MS);

    return () => dispose.forEach((fn) => fn());
  }, [die1, die2, rollId]);

  return (
    <section
      className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        backgroundColor: GAME_BOARD_COLORS.tile,
        borderColor: GAME_BOARD_COLORS.border,
        color: GAME_BOARD_COLORS.tileText,
      }}
    >
      <div
        className="rounded-[10px] border px-3 py-1.5 text-center font-display text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor: BOARD_TILE_COLORS.propertyBlue,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        {t('title')}
      </div>

      <div className="grid min-h-0 grid-cols-2 place-items-center gap-3 px-2 py-3">
        <DieFace value={displayDie1} tilt="rotateX(10deg) rotateY(-14deg) rotateZ(-12deg)" rolling={rolling} justSettled={justSettled} side="left" />
        <DieFace value={displayDie2} tilt="rotateX(8deg) rotateY(16deg) rotateZ(14deg)" rolling={rolling} justSettled={justSettled} side="right" />
      </div>

      <div className="flex flex-col items-center gap-1 px-2 py-2 text-[12px]">
        <span className="text-xl font-semibold" style={{ color: GAME_BOARD_COLORS.tileText }}>
          {t('total', { total })}
        </span>
        <span
          className="rounded-full px-3 py-1 font-semibold tracking-[0.02em]"
          style={{
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          {isDoubles ? t('doubles') : t('noDoubles')}
        </span>
      </div>
    </section>
  );
}
