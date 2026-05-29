'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useSessionStore } from '@/stores/session-store';
import { SessionVisibility } from '@/features/lobby';
import { createSession } from '@/features/lobby/api';
import { cn } from '@/shared/lib/cn';

export default function NewLobbyPage() {
  const router = useRouter();
  const { ready, token, user } = useRequireAuth();
  const setSession = useSessionStore((s) => s.setSession);

  const [visibility, setVisibility] = useState<SessionVisibility>(SessionVisibility.PUBLIC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const { session } = await createSession(token, { visibility }, user.id, user.display_name);
      setSession(session);
      router.push('/game/room');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (!ready) return <FullScreenSpinner />;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link
        href="/lobby"
        className="mb-6 inline-flex items-center gap-1 font-sans text-sm text-muted hover:text-ink"
      >
        ← Back to lobby
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Create a game</h1>
      <p className="mb-8 text-sm text-muted">
        Set up a room and share the invite code with friends.
      </p>

      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        {/* Visibility toggle */}
        <div>
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
            Visibility
          </p>
          <div className="flex gap-2">
            {([SessionVisibility.PUBLIC, SessionVisibility.PRIVATE] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={cn(
                  'flex-1 rounded-sm border py-2 text-sm font-semibold capitalize transition-colors',
                  visibility === v
                    ? 'border-ink bg-ink text-white'
                    : 'border-line-2 bg-surface text-ink hover:bg-paper',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {visibility === SessionVisibility.PUBLIC
              ? 'Anyone browsing the lobby can see and join.'
              : 'Only players with the invite code can join.'}
          </p>
        </div>

        {error && (
          <p className="rounded-sm border border-red/30 bg-red/5 px-3 py-2 text-sm text-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'h-10 w-full rounded-sm border font-semibold text-sm transition-colors',
            loading
              ? 'cursor-not-allowed border-line bg-paper text-muted'
              : 'border-gold-600 bg-gold text-white hover:bg-gold-600',
          )}
        >
          {loading ? 'Creating…' : 'Create Game'}
        </button>
      </form>
    </div>
  );
}
