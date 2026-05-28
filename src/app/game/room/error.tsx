'use client';

export default function GameRoomError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted">Something went wrong loading the game room.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-sm bg-blue px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
