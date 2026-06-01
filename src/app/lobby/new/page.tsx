'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useSessionStore } from '@/stores/session-store';
import { SessionVisibility } from '@/features/lobby';
import { createSession } from '@/features/lobby/api';
import { cn } from '@/shared/lib/cn';

export default function NewLobbyPage() {
  const t = useTranslations('Lobby.newLobby');
  const tLobby = useTranslations('Lobby');
  const router = useRouter();
  const { ready } = useRequireAuth();
  const setSession = useSessionStore((s) => s.setSession);

  const [visibility, setVisibility] = useState<SessionVisibility>(SessionVisibility.PUBLIC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { session } = await createSession({ visibility });
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
        {t('back')}
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">{t('title')}</h1>
      <p className="mb-8 text-sm text-muted">{t('subtitle')}</p>

      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        {/* Visibility toggle */}
        <div>
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
            {t('visibilityLabel')}
          </p>
          <div className="flex gap-2">
            {([SessionVisibility.PUBLIC, SessionVisibility.PRIVATE] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={cn(
                  'flex-1 rounded-sm border py-2 text-sm font-semibold transition-colors',
                  visibility === v
                    ? 'border-ink bg-ink text-white'
                    : 'border-line-2 bg-surface text-ink hover:bg-paper',
                )}
              >
                {tLobby(`visibility.${v}`)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {visibility === SessionVisibility.PUBLIC
              ? t('publicDescription')
              : t('privateDescription')}
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
          {loading ? t('creatingBtn') : t('createBtn')}
        </button>
      </form>
    </div>
  );
}
