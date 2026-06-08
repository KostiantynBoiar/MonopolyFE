'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';
import { SessionVisibility } from '../lobby.enums';
import { createSession } from '../api';
import { useRankedPreference } from '../hooks/useRankedPreference';

interface CreateLobbyFormProps {
  onBack?: () => void;
  /** Blocks creating while the player already has an active game to return to. */
  disabled?: boolean;
}

export function CreateLobbyForm({ onBack, disabled }: CreateLobbyFormProps) {
  const t = useTranslations('Lobby.newLobby');
  const tLobby = useTranslations('Lobby');
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const resetSocket = useSocketStore((s) => s.reset);

  const [visibility, setVisibility] = useState<SessionVisibility>(SessionVisibility.PUBLIC);
  const [ranked, setRanked] = useRankedPreference();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (disabled) return;
    setLoading(true);
    setError(null);

    try {
      const { session } = await createSession({ visibility, ranked });
      resetSocket();
      setSession(session);
      router.push(`/game/room/${session.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-fit font-sans text-sm text-muted hover:text-ink"
        >
          {t('back')}
        </button>
      )}

      <div>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
      </div>

      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {t('visibilityLabel')}
        </p>
        <div className="flex gap-2">
          {([SessionVisibility.PUBLIC, SessionVisibility.PRIVATE] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setVisibility(value)}
              className={cn(
                'flex-1 rounded-sm border py-2 text-sm font-semibold transition-colors',
                visibility === value
                  ? 'border-ink bg-ink text-white'
                  : 'border-line-2 bg-surface text-ink hover:bg-paper',
              )}
            >
              {tLobby(`visibility.${value}`)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {visibility === SessionVisibility.PUBLIC
            ? t('publicDescription')
            : t('privateDescription')}
        </p>
      </div>

      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {t('modeLabel')}
        </p>
        <div className="flex gap-2">
          {([false, true] as const).map((value) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setRanked(value)}
              className={cn(
                'flex-1 rounded-sm border py-2 text-sm font-semibold transition-colors',
                ranked === value
                  ? 'border-ink bg-ink text-white'
                  : 'border-line-2 bg-surface text-ink hover:bg-paper',
              )}
            >
              {value ? t('ranked') : t('unranked')}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {ranked ? t('rankedDescription') : t('unrankedDescription')}
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <button
        type="submit"
        disabled={loading || disabled}
        className={cn(
          'h-10 w-full rounded-sm border text-sm font-semibold transition-colors',
          loading || disabled
            ? 'cursor-not-allowed border-line bg-paper text-muted'
            : 'border-gold-600 bg-gold text-white hover:bg-gold-600',
        )}
      >
        {loading ? t('creatingBtn') : t('createBtn')}
      </button>
    </form>
  );
}
