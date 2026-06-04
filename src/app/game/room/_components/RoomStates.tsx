import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';

export function EmptyGameState({ sessionCode, status }: { sessionCode: string | null; status: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[18px] border border-line bg-surface px-5 text-center">
      <Spinner size="lg" />
      <div>
        <p className="font-display text-lg font-semibold text-ink">Loading game state</p>
        <p className="mt-1 text-sm text-muted">
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
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 rounded-[18px] border border-line bg-surface px-5 text-center">
      <div>
        <p className="font-display text-lg font-semibold text-ink">Game finished</p>
        <p className="mt-1 text-sm text-muted">
          {winnerName ? `${winnerName} won the game.` : 'This game has ended.'}
        </p>
      </div>
      <Button onClick={onLeave} variant="blue" disabled={isLeaving}>
        {isLeaving ? 'Leaving…' : 'Back to lobby'}
      </Button>
    </div>
  );
}
