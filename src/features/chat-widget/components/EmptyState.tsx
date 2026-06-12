import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

const C = GAME_BOARD_COLORS;

export function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 text-center"
      style={{ color: C.muted }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 opacity-40">
        <path
          d="M4 5h16v11H8l-4 3.5V5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[13px]">{label}</span>
    </div>
  );
}
