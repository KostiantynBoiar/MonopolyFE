'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, joinByCode, leaveSession, startGame } from '@/features/lobby/api';
import { SessionStatus, type SessionDetail } from '@/features/lobby';
import { GameStatus } from '@/shared/protocol/game-state.enums';
import { withTimeout } from '@/shared/lib/withTimeout';
import { useGameStore } from '@/stores/game-store';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';

const SESSION_RESTORE_TIMEOUT_MS = 5_000;
const ROOM_BOOT_TIMEOUT_MS = 7_000;

export interface RoomSession {
  currentSession: SessionDetail | null;
  sessionHydrated: boolean;
  sessionId: string | null;
  canConnectSocket: boolean;
  joinError: string | null;
  isJoiningByCode: boolean;
  isValidatingSession: boolean;
  validatedSessionId: string | null;
  sessionRestoreFailed: boolean;
  roomBootTimedOut: boolean;
  isLeaving: boolean;
  isStarting: boolean;
  handleStartGame: () => Promise<void>;
  handleLeaveRoom: () => Promise<void>;
}

/**
 * Owns the room's session lifecycle: boot-timeout guard, join-by-invite-code,
 * session restoration/validation, kick handling, finished-game cleanup, plus the
 * leave/start actions. Keeps all of this churn out of the page component.
 */
export function useRoomSession(ready: boolean): RoomSession {
  const router = useRouter();

  const currentSession = useSessionStore((state) => state.currentSession);
  const sessionHydrated = useSessionStore((state) => state._hasHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const wasKicked = useSocketStore((state) => state.wasKicked);
  const resetSocket = useSocketStore((state) => state.reset);
  const resetGame = useGameStore((state) => state.reset);
  const gameStatus = useGameStore((state) => state.snapshot.game.status);

  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const [validatedSessionId, setValidatedSessionId] = useState<string | null>(null);
  const [sessionRestoreFailed, setSessionRestoreFailed] = useState(false);
  const [roomBootTimedOut, setRoomBootTimedOut] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const sessionId = currentSession?.id ?? null;
  const canConnectSocket = Boolean(ready && sessionId && validatedSessionId === sessionId);

  // ─── Boot timeout ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (ready && sessionHydrated && !isJoiningByCode && !isValidatingSession) {
      setRoomBootTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setRoomBootTimedOut(true), ROOM_BOOT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isJoiningByCode, isValidatingSession, ready, sessionHydrated]);

  // ─── Join by invite code ───────────────────────────────────────────────────

  useEffect(() => {
    if (!ready || !sessionHydrated || currentSession || isJoiningByCode) return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    setIsJoiningByCode(true);
    joinByCode({ invite_code: code })
      .then(({ session }) => { resetSocket(); setSession(session); setJoinError(null); router.replace('/game/room'); })
      .catch((error) => setJoinError((error as Error).message))
      .finally(() => setIsJoiningByCode(false));
  }, [currentSession, isJoiningByCode, ready, router, sessionHydrated, resetSocket, setSession]);

  // ─── Session validation ────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready || !sessionHydrated || isJoiningByCode) return;

    const sessionIdToValidate = currentSession?.id;
    if (!sessionIdToValidate) {
      setValidatedSessionId(null);
      setSessionRestoreFailed(false);
      return;
    }
    if (validatedSessionId === sessionIdToValidate) return;

    let cancelled = false;
    setIsValidatingSession(true);
    setSessionRestoreFailed(false);

    withTimeout(getSession(sessionIdToValidate), SESSION_RESTORE_TIMEOUT_MS, 'Could not restore the room session.')
      .then(({ session }) => {
        if (cancelled) return;
        setSession(session);
        setValidatedSessionId(session.id);
        setSessionRestoreFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setValidatedSessionId(null);
        setSessionRestoreFailed(true);
        clearSession();
        resetSocket();
        resetGame();
        router.replace('/lobby');
      })
      .finally(() => {
        setIsValidatingSession(false);
      });

    return () => { cancelled = true; };
  }, [
    clearSession, currentSession?.id, isJoiningByCode, ready,
    resetGame, resetSocket, router, sessionHydrated, setSession, validatedSessionId,
  ]);

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
    if (!sessionId || isStarting) return;
    setIsStarting(true);
    try { await startGame(sessionId); } finally { setIsStarting(false); }
  }, [isStarting, sessionId]);

  const handleLeaveRoom = useCallback(async () => {
    if (!sessionId || isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveSession(sessionId);
      clearSession();
      resetSocket();
      router.replace('/lobby');
    } finally {
      setIsLeaving(false);
    }
  }, [clearSession, isLeaving, resetSocket, router, sessionId]);

  return {
    currentSession,
    sessionHydrated,
    sessionId,
    canConnectSocket,
    joinError,
    isJoiningByCode,
    isValidatingSession,
    validatedSessionId,
    sessionRestoreFailed,
    roomBootTimedOut,
    isLeaving,
    isStarting,
    handleStartGame,
    handleLeaveRoom,
  };
}
