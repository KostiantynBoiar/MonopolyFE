'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, leaveSession, startGame } from '@/features/lobby/api';
import { SessionStatus, type SessionDetail } from '@/features/lobby';
import { GameStatus } from '@/shared/protocol/game-state.enums';
import { withTimeout } from '@/shared/lib/withTimeout';
import { useGameStore } from '@/stores/game-store';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';

const SESSION_RESTORE_TIMEOUT_MS = 5_000;

export interface RoomSession {
  currentSession: SessionDetail | null;
  sessionId: string;
  canConnectSocket: boolean;
  loadError: string | null;
  isLoading: boolean;
  isLeaving: boolean;
  isStarting: boolean;
  handleStartGame: () => Promise<void>;
  handleLeaveRoom: () => Promise<void>;
}

/**
 * Owns the room's session lifecycle for the canonical `/game/room/[sessionId]`
 * route. The session id comes straight from the URL — the single source of
 * truth — so there is no localStorage-rehydration race to guard against. On
 * mount it fetches+validates the session server-side (which doubles as the
 * membership check), wires up kick handling and finished-game cleanup, and
 * exposes the leave/start actions.
 */
export function useRoomSession(sessionId: string, ready: boolean): RoomSession {
  const router = useRouter();

  const currentSession = useSessionStore((state) => state.currentSession);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const wasKicked = useSocketStore((state) => state.wasKicked);
  const resetSocket = useSocketStore((state) => state.reset);
  const resetGame = useGameStore((state) => state.reset);
  const gameStatus = useGameStore((state) => state.snapshot.game.status);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const canConnectSocket = Boolean(ready && loadedSessionId === sessionId);

  // ─── Load + validate the session named in the URL ──────────────────────────
  // Keyed strictly on the URL `sessionId` (not on the id echoed back by the
  // server) so a missing param or a normalized response id can never spin us
  // into a refetch loop. Re-runs only when auth becomes ready or the id changes.

  useEffect(() => {
    if (!ready) return;

    let active = true;

    const loadSession = async () => {
      await Promise.resolve();
      if (!active) return;

      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      setLoadedSessionId(null);

      withTimeout(getSession(sessionId), SESSION_RESTORE_TIMEOUT_MS, 'Could not load the room session.')
        .then(({ session }) => {
          if (!active) return;
          setSession(session);
          setLoadedSessionId(sessionId);
        })
        .catch((error) => {
          if (!active) return;
          clearSession();
          resetSocket();
          resetGame();
          setLoadError((error as Error).message);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    };

    void loadSession();

    return () => { active = false; };
  }, [clearSession, ready, resetGame, resetSocket, sessionId, setSession]);

  // ─── Kick handling ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!wasKicked) return;
    clearSession();
    resetSocket();
    router.replace('/lobby?kicked=1');
  }, [clearSession, resetSocket, router, wasKicked]);

  // ─── Finished-game persistence cleanup ─────────────────────────────────────

  useEffect(() => {
    const finished =
      currentSession?.status === SessionStatus.FINISHED ||
      gameStatus === GameStatus.FINISHED;
    if (finished) useGameStore.persist.clearStorage();
  }, [currentSession?.status, gameStatus]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleStartGame = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    try { await startGame(sessionId); } finally { setIsStarting(false); }
  }, [isStarting, sessionId]);

  const handleLeaveRoom = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveSession(sessionId);
    } catch {
      // Session may already be finished — navigate anyway.
    } finally {
      clearSession();
      resetSocket();
      router.replace('/lobby');
      setIsLeaving(false);
    }
  }, [clearSession, isLeaving, resetSocket, router, sessionId]);

  return {
    currentSession,
    sessionId,
    canConnectSocket,
    loadError,
    isLoading,
    isLeaving,
    isStarting,
    handleStartGame,
    handleLeaveRoom,
  };
}
