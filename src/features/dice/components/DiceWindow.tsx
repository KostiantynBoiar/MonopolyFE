    
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
        backgroundColor: GAME_BOARD_COLORS.diceDieFace,
        borderColor: GAME_BOARD_COLORS.diceDieEdge,
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
      className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        backgroundColor: GAME_BOARD_COLORS.dicePanelSurface,
        borderColor: GAME_BOARD_COLORS.dicePanelBorder,
        color: GAME_BOARD_COLORS.dicePanelText,
      }}
    >
      <div
        className="rounded-[10px] border px-3 py-1.5 text-center font-display text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{
          backgroundColor: GAME_BOARD_COLORS.widgetHeader,
          borderColor: GAME_BOARD_COLORS.widgetHeader,
          color: GAME_BOARD_COLORS.widgetHeaderText,
        }}
      >
        Dice
      </div>

      <div className="grid min-h-0 grid-cols-2 place-items-center gap-3 px-2 py-3">
        <DieFace value={die1} tilt="rotate(-12deg)" />
        <DieFace value={die2} tilt="rotate(14deg)" />
      </div>

      <div className="flex flex-col items-center gap-1 rounded-[10px] border px-2 py-2 text-[12px]" style={{
        backgroundColor: GAME_BOARD_COLORS.widgetSurfaceAlt,
        borderColor: GAME_BOARD_COLORS.widgetBorder,
      }}>
        <span className="text-xl font-semibold" style={{ color: GAME_BOARD_COLORS.dicePanelText }}>
          Total: {total}
        </span>
        <span
          className="rounded-full px-3 py-1 font-semibold tracking-[0.02em]"
          style={{
            backgroundColor: GAME_BOARD_COLORS.diceStatus,
            color: GAME_BOARD_COLORS.diceStatusText,
          }}
        >
          {isDoubles ? 'Doubles' : 'No doubles'}
        </span>
      </div>
    </section>
  );
}
