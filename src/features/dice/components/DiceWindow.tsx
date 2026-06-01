    
'use client';

import type { DiceRoll } from '@/shared/protocol/game-state';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

interface DiceWindowProps {
  diceRoll?: DiceRoll | null;
}

const PIP_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

function DieFace({ value, tilt }: { value: number; tilt: string }) {
  return (
    <div
      className="relative aspect-square w-full max-w-[72px] rounded-[18px] border"
      style={{
        background: `linear-gradient(180deg, ${GAME_BOARD_COLORS.diceGlow} 0%, ${GAME_BOARD_COLORS.diceDieFace} 26%, ${GAME_BOARD_COLORS.diceDieFace} 100%)`,
        borderColor: GAME_BOARD_COLORS.diceDieEdge,
        boxShadow: `0 10px 18px ${GAME_BOARD_COLORS.diceShadow}, inset 0 2px 0 ${GAME_BOARD_COLORS.diceGlow}`,
        transform: tilt,
      }}
    >
      {PIP_LAYOUTS[value].map(([row, col], index) => (
        <span
          key={`${value}-${index}`}
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            top: `${row * 25}%`,
            left: `${col * 25}%`,
            backgroundColor: GAME_BOARD_COLORS.dicePip,
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22)',
          }}
        />
      ))}
    </div>
  );
}

export function DiceWindow({ diceRoll }: DiceWindowProps) {
  const die1 = diceRoll?.die1 ?? 1;
  const die2 = diceRoll?.die2 ?? 1;
  const total = die1 + die2;
  const isDoubles = diceRoll?.isDoubles ?? false;

  return (
    <section
      className="relative grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[18px] border px-3 py-2"
      style={{
        background: GAME_BOARD_COLORS.dicePanelSurface,
        borderColor: GAME_BOARD_COLORS.dicePanelBorder,
        color: GAME_BOARD_COLORS.dicePanelText,
        boxShadow: `0 10px 20px ${GAME_BOARD_COLORS.diceShadow}, inset 0 1px 0 ${GAME_BOARD_COLORS.dicePanelInset}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at top, ${GAME_BOARD_COLORS.diceGlow}, transparent 60%)`,
        }}
      />
      <p
        className="relative text-center font-display text-[12px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: GAME_BOARD_COLORS.dicePanelText }}
      >
        Dice
      </p>

      <div className="relative grid min-h-0 grid-cols-2 place-items-center gap-3 py-2">
        <DieFace value={die1} tilt="rotate(-12deg)" />
        <DieFace value={die2} tilt="rotate(14deg)" />
      </div>

      <div className="relative flex flex-col items-center gap-1 text-[12px]">
        <span className="text-xl font-semibold" style={{ color: GAME_BOARD_COLORS.dicePanelText }}>
          Total: {total}
        </span>
        <span
          className="rounded-full px-3 py-1 font-semibold tracking-[0.02em]"
          style={{
            backgroundColor: GAME_BOARD_COLORS.diceStatus,
            color: GAME_BOARD_COLORS.diceStatusText,
            boxShadow: `inset 0 1px 0 ${GAME_BOARD_COLORS.diceGlow}`,
          }}
        >
          {isDoubles ? 'Doubles' : 'No doubles'}
        </span>
      </div>
    </section>
  );
}
