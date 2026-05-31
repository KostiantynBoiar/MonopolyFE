'use client';

import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useLobby, SessionCard, JoinByCodeForm } from '@/features/lobby';
import { useSessionStore } from '@/stores/session-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasKicked = searchParams.get('kicked') === '1';

  const { ready } = useRequireAuth();
  const setSession = useSessionStore((s) => s.setSession);

  const {
    sessions, loading, error, joiningId,
    nextCursor, isLoadingMore,
    refresh, loadMore, join, joinWithCode,
  } = useLobby();

  async function handleJoin(sessionId: string) {
    try {
      const session = await join(sessionId);
      setSession(session);
      router.push('/game/room');
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleJoinByCode(code: string) {
    const session = await joinWithCode(code);
    setSession(session);
    router.push('/game/room');
  }

  if (!ready) return <FullScreenSpinner />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Kicked notice */}
      {wasKicked && (
        <div className="mb-6 flex items-center gap-3 rounded-sm border border-red/30 bg-red/5 px-4 py-3">
          <span className="text-sm text-red">You were removed from the game by the host.</span>
          <Button as="a" href="/lobby" variant="ghost" size="sm" className="ml-auto shrink-0">
            Dismiss
          </Button>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Public Games</h1>
          <p className="mt-1 text-sm text-muted">Join an open room or create your own.</p>
        </div>
        <Button as="a" href="/lobby/new" variant="gold" size="md">
          + New Game
        </Button>
      </div>

      {/* Join by invite code */}
      <div className="mb-8 rounded-sm border border-line bg-surface px-4 py-4">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          Join with invite code
        </p>
        <JoinByCodeForm onSubmit={handleJoinByCode} />
      </div>

      {/* Session list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
            Open rooms
          </p>
          <button
            onClick={refresh}
            disabled={loading}
            className="font-sans text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-muted">
            Loading rooms…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-sm border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted">No open rooms right now.</p>
            <Button as="a" href="/lobby/new" variant="blue" size="sm">
              Create one
            </Button>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onJoin={handleJoin}
                isJoining={joiningId === s.id}
              />
            ))}

            {nextCursor && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="mt-1 w-full rounded-sm border border-line-2 bg-surface py-2 text-sm font-semibold text-muted transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
