'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useLobby, SessionCard, JoinByCodeForm, CreateLobbyForm } from '@/features/lobby';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/cn';
import { SessionStatus } from '@/features/lobby/lobby.enums';

type StatusFilter = 'all' | SessionStatus.WAITING | SessionStatus.IN_PROGRESS;
type LobbyPanel = 'join' | 'create';

export default function LobbyPage() {
  const t = useTranslations('Lobby');
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasKicked = searchParams.get('kicked') === '1';
  const panelParam = searchParams.get('panel');

  const { ready } = useRequireAuth();
  const setSession = useSessionStore((s) => s.setSession);
  const resetSocket = useSocketStore((s) => s.reset);
  const currentSession = useSessionStore((s) => s.currentSession);
  const hasSessionHydrated = useSessionStore((s) => s._hasHydrated);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hideFullRooms, setHideFullRooms] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<LobbyPanel>(panelParam === 'create' ? 'create' : 'join');

  const {
    sessions, loading, error, joiningId,
    nextCursor, isLoadingMore,
    refresh, loadMore, join, joinWithCode,
  } = useLobby();

  async function handleJoin(sessionId: string) {
    setJoinError(null);
    try {
      const session = await join(sessionId);
      resetSocket();
      setSession(session);
      router.push('/game/room');
    } catch (err) {
      setJoinError((err as Error).message);
    }
  }

  async function handleJoinByCode(code: string) {
    const session = await joinWithCode(code);
    resetSocket();
    setSession(session);
    router.push('/game/room');
  }

  function switchPanel(panel: LobbyPanel) {
    setJoinError(null);
    setActivePanel(panel);
    router.replace(panel === 'create' ? '/lobby?panel=create' : '/lobby');
  }

  useEffect(() => {
    setActivePanel(panelParam === 'create' ? 'create' : 'join');
  }, [panelParam]);

  if (!ready) return <FullScreenSpinner />;

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-12">
      {/* Kicked notice */}
      {wasKicked && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-red/30 bg-red/5 px-3 py-2 sm:mb-5 sm:gap-3 sm:px-4 sm:py-3 lg:mb-6">
          <span className="text-xs text-red sm:text-sm">{t('kickedNotice')}</span>
          <Button as="a" href="/lobby" variant="ghost" size="sm" className="ml-auto shrink-0">
            {t('dismiss')}
          </Button>
        </div>
      )}

      {/* Join error */}
      {joinError && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-red/30 bg-red/5 px-3 py-2 sm:mb-5 sm:gap-3 sm:px-4 sm:py-3">
          <span className="min-w-0 flex-1 text-xs text-red sm:text-sm">{joinError}</span>
          <button onClick={() => setJoinError(null)} className="shrink-0 text-xs text-red/60 hover:text-red">✕</button>
        </div>
      )}

      {/* Page header */}
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:gap-4 lg:mb-10">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl lg:text-3xl">{t('publicGames')}</h1>
          <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm lg:text-base">{t('joinOrCreate')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {hasSessionHydrated && currentSession && (
            <Button as="a" href="/game/room" variant="blue" size="md">
              {t('backToGame')}
            </Button>
          )}
          {activePanel === 'join' ? (
            <Button onClick={() => switchPanel('create')} variant="gold" size="md">
              {t('newGame')}
            </Button>
          ) : (
            <Button onClick={() => switchPanel('join')} variant="ghost" size="md">
              {t('joinWithInviteCode')}
            </Button>
          )}
        </div>
      </div>

      {/* Join by invite code / create lobby */}
      <div className="mb-5 rounded-sm border border-line bg-surface px-3 py-3 sm:mb-7 sm:px-4 sm:py-4 lg:mb-10 lg:px-5 lg:py-5">
        {activePanel === 'join' ? (
          <>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted sm:mb-2 sm:text-xs lg:text-sm">
              {t('joinWithInviteCode')}
            </p>
            <JoinByCodeForm onSubmit={handleJoinByCode} />
          </>
        ) : (
          <CreateLobbyForm onBack={() => switchPanel('join')} />
        )}
      </div>

      {/* Session list */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3 sm:gap-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted sm:text-xs lg:text-sm">
            {t('openRooms')}
          </p>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {([
              { value: 'all',                        label: t('all') },
              { value: SessionStatus.WAITING,        label: t('waiting') },
              { value: SessionStatus.IN_PROGRESS,    label: t('inProgress') },
            ] as { value: StatusFilter; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-xs lg:text-sm',
                  statusFilter === value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-surface text-muted hover:border-ink/40 hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Hide full toggle */}
          <button
            onClick={() => setHideFullRooms((v) => !v)}
            className={cn(
              'rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-xs lg:text-sm',
              hideFullRooms
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-surface text-muted hover:border-ink/40 hover:text-ink',
            )}
          >
            {t('hideFull')}
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto font-sans text-[10px] text-muted underline-offset-2 hover:text-ink hover:underline sm:text-xs lg:text-sm"
          >
            {t('refresh')}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 text-xs text-muted sm:py-14 sm:text-sm lg:py-20 lg:text-base">
            {t('loadingRooms')}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-sm border border-red/30 bg-red/5 px-3 py-2 text-xs text-red sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center sm:gap-3 sm:py-14 lg:py-20">
            <p className="text-xs text-muted sm:text-sm lg:text-base">{t('noOpenRooms')}</p>
            <Button onClick={() => switchPanel('create')} variant="blue" size="sm">
              {t('createOne')}
            </Button>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (() => {
          const filtered = sessions.filter((s) => {
            if (statusFilter !== 'all' && s.status !== statusFilter) return false;
            if (hideFullRooms && s.member_count >= s.max_players) return false;
            return true;
          });

          return (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted sm:py-14 sm:text-sm lg:py-20 lg:text-base">
                {t('noMatchingRooms')}
              </p>
            ) : filtered.map((s) => (
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
                className="mt-1 w-full rounded-sm border border-line-2 bg-surface py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:py-2 sm:text-sm lg:py-2.5 lg:text-base"
              >
                {isLoadingMore ? t('loading') : t('loadMore')}
              </button>
            )}
          </div>
          );
        })()}
      </div>
    </div>
  );
}
