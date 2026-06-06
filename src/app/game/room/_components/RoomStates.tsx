import { Spinner } from '@/shared/ui/Spinner';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

export function EmptyGameState({ sessionCode, status }: { sessionCode: string | null; status: string }) {
  return (
    <div
      className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[18px] border px-5 text-center"
      style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
    >
      <Spinner size="lg" />
      <div>
        <p className="font-display text-lg font-semibold" style={{ color: GAME_BOARD_COLORS.text }}>Loading game state</p>
        <p className="mt-1 text-sm" style={{ color: GAME_BOARD_COLORS.muted }}>
          {sessionCode ? `Room ${sessionCode}` : 'Room'} is connected as {status}.
        </p>
      </div>
    </div>
  );
}

export function FinishedGameState({
  winnerName,
  onLeave,
  isLeaving,
}: {
  winnerName: string | null;
  onLeave: () => void;
  isLeaving: boolean;
}) {
  return (
    <div
      className="flex h-full min-h-0 flex-col items-center justify-center gap-4 rounded-[18px] border px-5 text-center"
      style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
    >
      <div>
        <p className="font-display text-lg font-semibold" style={{ color: GAME_BOARD_COLORS.text }}>Game finished</p>
        <p className="mt-1 text-sm" style={{ color: GAME_BOARD_COLORS.muted }}>
          {winnerName ? `${winnerName} won the game.` : 'This game has ended.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onLeave}
        disabled={isLeaving}
        className="rounded-[10px] border px-5 py-2 font-display text-sm font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor:     BOARD_TILE_COLORS.propertyBlue,
          color:           BOARD_TILE_COLORS.altText,
        }}
      >
        {isLeaving ? 'Leaving…' : 'Back to lobby'}
      </button>
    </div>
  );
}
