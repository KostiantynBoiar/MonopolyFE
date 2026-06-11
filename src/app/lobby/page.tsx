'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { LobbyFilters } from '@/features/lobby/components/LobbyFilters';
import { JoinByCodeForm } from '@/features/lobby/components/JoinByCodeForm';
import { CreateLobbyForm } from '@/features/lobby/components/CreateLobbyForm';
import { SessionCard } from '@/features/lobby/components/SessionCard';
import { useActiveSession } from '@/features/lobby/hooks/useActiveSession';
import { useLobby } from '@/features/lobby/hooks/useLobby';
import { useLobbyRoomEntry } from '@/features/lobby/hooks/useLobbyRoomEntry';
import {
  CommonFilterValue,
  LobbyPanel,
  RankedFilterValue,
  filterLobbySessions,
  getRankedFilterOptions,
  getStatusFilterOptions,
  resolveLobbyPanel,
  type RankedFilter,
  type StatusFilter,
} from '@/features/lobby/lobby.filters';

export default function LobbyPage() {
  const t = useTranslations('Lobby');
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasKicked = searchParams.get('kicked') === '1';

  const { ready } = useRequireAuth();

  // The persisted session pointer is validated against the server before we
  // offer "Back to game" — and while one is active, joining/creating is blocked.
  const { session: activeSession } = useActiveSession(ready);
  const hasActiveSession = Boolean(activeSession);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(CommonFilterValue.ALL);
  const [rankedFilter, setRankedFilter] = useState<RankedFilter>(RankedFilterValue.ALL);
  const [hideFullRooms, setHideFullRooms] = useState(false);
  const activePanel = resolveLobbyPanel(searchParams.get('panel'));
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);
  const rankedFilterOptions = useMemo(() => getRankedFilterOptions(t), [t]);

  const {
    sessions, loading, error, joiningId,
    nextCursor, isLoadingMore,
    refresh, loadMore, join, joinWithCode,
  } = useLobby();

  const {
    joinError,
    isEnteringRoom,
    blocksRoomEntry,
    canUseLobbyActions,
    clearJoinError,
    setIsEnteringRoom,
    handleJoin,
    handleJoinByCode,
  } = useLobbyRoomEntry({ hasActiveSession, join, joinWithCode });

  const filteredSessions = useMemo(
    () => filterLobbySessions(sessions, {
      status: statusFilter,
      ranked: rankedFilter,
      hideFullRooms,
    }),
    [hideFullRooms, rankedFilter, sessions, statusFilter],
  );

  function switchPanel(panel: LobbyPanel) {
    clearJoinError();
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
            <button onClick={clearJoinError} className="shrink-0 text-xs text-red/60 hover:text-red">✕</button>
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
          {activeSession && !isEnteringRoom && (
            <Button as="a" href={`/game/room/${activeSession.id}`} variant="blue" size="md">
              {t('backToGame')}
            </Button>
          )}
          {canUseLobbyActions &&
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
      {blocksRoomEntry && (
        <Alert className="mb-4 sm:mb-5">{t('alreadyInGame')}</Alert>
      )}

      {/* Join by invite code / create lobby */}
      <div className="mb-5 rounded-sm border border-line bg-surface px-3 py-3 sm:mb-7 sm:px-4 sm:py-4 lg:mb-10 lg:px-5 lg:py-5">
        {activePanel === LobbyPanel.JOIN ? (
          <>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted sm:mb-2 sm:text-xs lg:text-sm">
              {t('joinWithInviteCode')}
            </p>
            <JoinByCodeForm onSubmit={handleJoinByCode} disabled={!canUseLobbyActions} />
          </>
        ) : (
          <CreateLobbyForm
            onBack={() => switchPanel(LobbyPanel.JOIN)}
            onCreatePendingChange={setIsEnteringRoom}
            disabled={!canUseLobbyActions}
          />
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

        <LobbyFilters
          statusLabel={t('filterStatus')}
          modeLabel={t('filterMode')}
          capacityLabel={t('filterCapacity')}
          hideFullLabel={t('hideFull')}
          statusFilter={statusFilter}
          rankedFilter={rankedFilter}
          hideFullRooms={hideFullRooms}
          statusOptions={statusFilterOptions}
          rankedOptions={rankedFilterOptions}
          onStatusChange={setStatusFilter}
          onRankedChange={setRankedFilter}
          onHideFullRoomsToggle={() => setHideFullRooms((v) => !v)}
        />

        {loading && (
          <div className="flex items-center justify-center py-10 text-xs text-muted sm:py-14 sm:text-sm lg:py-20 lg:text-base">
            {t('loadingRooms')}
          </div>
        )}

        {!loading && error && <Alert>{error}</Alert>}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center sm:gap-3 sm:py-14 lg:py-20">
            <p className="text-xs text-muted sm:text-sm lg:text-base">{t('noOpenRooms')}</p>
            {canUseLobbyActions && (
              <Button onClick={() => switchPanel(LobbyPanel.CREATE)} variant="blue" size="sm">
                {t('createOne')}
              </Button>
            )}
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {filteredSessions.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted sm:py-14 sm:text-sm lg:py-20 lg:text-base">
                {t('noMatchingRooms')}
              </p>
            ) : filteredSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onJoin={handleJoin}
                isJoining={joiningId === s.id}
                disabled={!canUseLobbyActions}
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
        )}
      </div>
    </div>
  );
}
