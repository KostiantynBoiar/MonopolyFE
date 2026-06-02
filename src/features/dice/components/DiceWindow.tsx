    
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { DiceRoll } from '@/shared/protocol/game-state';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

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
          ? `${side === 'left' ? 'monopoly-die-roll-left' : 'monopoly-die-roll-right'} 760ms cubic-bezier(.16,.84,.28,1)`
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

  useEffect(() => {
    if (rollId === 0) {
      setDisplayDie1(die1);
      setDisplayDie2(die2);
      setSettledRoll({ die1, die2, isDoubles: die1 === die2 });
      return;
    }

    setRolling(true);
    setJustSettled(false);
    const interval = window.setInterval(() => {
      setDisplayDie1(randomFace());
      setDisplayDie2(randomFace());
    }, 70);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setDisplayDie1(die1);
      setDisplayDie2(die2);
      setSettledRoll({ die1, die2, isDoubles: die1 === die2 });
      setRolling(false);
      setJustSettled(true);
      window.setTimeout(() => setJustSettled(false), 340);
    }, 760);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
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
        Dice
      </div>

      <div className="grid min-h-0 grid-cols-2 place-items-center gap-3 px-2 py-3">
        <DieFace value={displayDie1} tilt="rotateX(10deg) rotateY(-14deg) rotateZ(-12deg)" rolling={rolling} justSettled={justSettled} side="left" />
        <DieFace value={displayDie2} tilt="rotateX(8deg) rotateY(16deg) rotateZ(14deg)" rolling={rolling} justSettled={justSettled} side="right" />
      </div>

      <div className="flex flex-col items-center gap-1 px-2 py-2 text-[12px]">
        <span className="text-xl font-semibold" style={{ color: GAME_BOARD_COLORS.tileText }}>
          Total: {total}
        </span>
        <span
          className="rounded-full px-3 py-1 font-semibold tracking-[0.02em]"
          style={{
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          {isDoubles ? 'Doubles' : 'No doubles'}
        </span>
      </div>
    </section>
  );
}
