'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useLobby, useActiveSession, SessionCard, JoinByCodeForm, CreateLobbyForm } from '@/features/lobby';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';
import { Alert, Button, FilterPill } from '@/shared/ui';
import { SessionStatus } from '@/features/lobby/lobby.enums';

enum CommonFilterValue {
  ALL = 'all',
}

enum RankedFilterValue {
  ALL = 'all',
  RANKED = 'ranked',
  UNRANKED = 'unranked',
}

enum LobbyPanel {
  JOIN = 'join',
  CREATE = 'create',
}

type StatusFilter = CommonFilterValue.ALL | SessionStatus.WAITING | SessionStatus.IN_PROGRESS;
type RankedFilter = RankedFilterValue;

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 rounded-sm border border-line bg-paper/70 px-2.5 py-2 sm:px-3">
      <legend className="px-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-muted sm:text-[10px]">
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">{children}</div>
    </fieldset>
  );
}

export default function LobbyPage() {
  const t = useTranslations('Lobby');
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasKicked = searchParams.get('kicked') === '1';
  const panelParam = searchParams.get('panel');

  const { ready } = useRequireAuth();
  const setSession = useSessionStore((s) => s.setSession);
  const resetSocket = useSocketStore((s) => s.reset);

  // The persisted session pointer is validated against the server before we
  // offer "Back to game" — and while one is active, joining/creating is blocked.
  const { session: activeSession } = useActiveSession(ready);
  const hasActiveSession = Boolean(activeSession);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(CommonFilterValue.ALL);
  const [rankedFilter, setRankedFilter] = useState<RankedFilter>(RankedFilterValue.ALL);
  const [hideFullRooms, setHideFullRooms] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const activePanel: LobbyPanel = panelParam === LobbyPanel.CREATE ? LobbyPanel.CREATE : LobbyPanel.JOIN;
  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: CommonFilterValue.ALL, label: t('all') },
    { value: SessionStatus.WAITING, label: t('waiting') },
    { value: SessionStatus.IN_PROGRESS, label: t('inProgress') },
  ];
  const rankedFilterOptions: { value: RankedFilter; label: string }[] = [
    { value: RankedFilterValue.ALL, label: t('all') },
    { value: RankedFilterValue.RANKED, label: t('ranked') },
    { value: RankedFilterValue.UNRANKED, label: t('unranked') },
  ];

  const {
    sessions, loading, error, joiningId,
    nextCursor, isLoadingMore,
    refresh, loadMore, join, joinWithCode,
  } = useLobby();

  async function handleJoin(sessionId: string) {
    if (hasActiveSession) return;
    setJoinError(null);
    try {
      const session = await join(sessionId);
      resetSocket();
      setSession(session);
      router.push(`/game/room/${session.id}`);
    } catch (err) {
      setJoinError((err as Error).message);
    }
  }

  async function handleJoinByCode(code: string) {
    if (hasActiveSession) return;
    const session = await joinWithCode(code);
    resetSocket();
    setSession(session);
    router.push(`/game/room/${session.id}`);
  }

  function switchPanel(panel: LobbyPanel) {
    setJoinError(null);
    router.replace(panel === LobbyPanel.CREATE ? '/lobby?panel=create' : '/lobby');
  }

  if (!ready) return <FullScreenSpinner />;

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-12">
      {/* Kicked notice */}
      {wasKicked && (
        <Alert
          className="mb-4 sm:mb-5 lg:mb-6"
          action={
            <Button as="a" href="/lobby" variant="ghost" size="sm" className="shrink-0">
              {t('dismiss')}
            </Button>
          }
        >
          {t('kickedNotice')}
        </Alert>
      )}

      {/* Join error */}
      {joinError && (
        <Alert
          className="mb-4 sm:mb-5"
          action={
            <button onClick={() => setJoinError(null)} className="shrink-0 text-xs text-red/60 hover:text-red">✕</button>
          }
        >
          {joinError}
        </Alert>
      )}

      {/* Page header */}
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:gap-4 lg:mb-10">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl lg:text-3xl">{t('publicGames')}</h1>
          <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm lg:text-base">{t('joinOrCreate')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {activeSession && (
            <Button as="a" href={`/game/room/${activeSession.id}`} variant="blue" size="md">
              {t('backToGame')}
            </Button>
          )}
          {!hasActiveSession &&
            (activePanel === LobbyPanel.JOIN ? (
              <Button onClick={() => switchPanel(LobbyPanel.CREATE)} variant="gold" size="md">
                {t('newGame')}
              </Button>
            ) : (
              <Button onClick={() => switchPanel(LobbyPanel.JOIN)} variant="ghost" size="md">
                {t('joinWithInviteCode')}
              </Button>
            ))}
        </div>
      </div>

      {/* Already-in-game notice — joining/creating is blocked until you return or leave */}
      {hasActiveSession && (
        <Alert className="mb-4 sm:mb-5">{t('alreadyInGame')}</Alert>
      )}

      {/* Join by invite code / create lobby */}
      <div className="mb-5 rounded-sm border border-line bg-surface px-3 py-3 sm:mb-7 sm:px-4 sm:py-4 lg:mb-10 lg:px-5 lg:py-5">
        {activePanel === LobbyPanel.JOIN ? (
          <>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted sm:mb-2 sm:text-xs lg:text-sm">
              {t('joinWithInviteCode')}
            </p>
            <JoinByCodeForm onSubmit={handleJoinByCode} disabled={hasActiveSession} />
          </>
        ) : (
          <CreateLobbyForm onBack={() => switchPanel(LobbyPanel.JOIN)} disabled={hasActiveSession} />
        )}
      </div>

      {/* Session list */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted sm:text-xs lg:text-sm">
            {t('openRooms')}
          </p>
          <button
            onClick={refresh}
            disabled={loading}
            className="font-sans text-[10px] text-muted underline-offset-2 hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs lg:text-sm"
          >
            {t('refresh')}
          </button>
        </div>

        <div className="mb-3 rounded-sm border border-line bg-surface p-2 shadow-sm sm:mb-4 sm:p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
            <FilterGroup label={t('filterStatus')}>
              {statusFilterOptions.map(({ value, label }) => (
                <FilterPill
                  key={value}
                  active={statusFilter === value}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </FilterPill>
              ))}
            </FilterGroup>

            <FilterGroup label={t('filterMode')}>
              {rankedFilterOptions.map(({ value, label }) => (
                <FilterPill
                  key={value}
                  active={rankedFilter === value}
                  onClick={() => setRankedFilter(value)}
                >
                  {label}
                </FilterPill>
              ))}
            </FilterGroup>

            <FilterGroup label={t('filterCapacity')}>
              <FilterPill active={hideFullRooms} onClick={() => setHideFullRooms((v) => !v)}>
                {t('hideFull')}
              </FilterPill>
            </FilterGroup>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 text-xs text-muted sm:py-14 sm:text-sm lg:py-20 lg:text-base">
            {t('loadingRooms')}
          </div>
        )}

        {!loading && error && <Alert>{error}</Alert>}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center sm:gap-3 sm:py-14 lg:py-20">
            <p className="text-xs text-muted sm:text-sm lg:text-base">{t('noOpenRooms')}</p>
            {!hasActiveSession && (
              <Button onClick={() => switchPanel(LobbyPanel.CREATE)} variant="blue" size="sm">
                {t('createOne')}
              </Button>
            )}
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (() => {
          const filtered = sessions.filter((s) => {
            if (statusFilter !== CommonFilterValue.ALL && s.status !== statusFilter) return false;
            if (rankedFilter === RankedFilterValue.RANKED && !s.ranked) return false;
            if (rankedFilter === RankedFilterValue.UNRANKED && s.ranked) return false;
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
                disabled={hasActiveSession}
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
