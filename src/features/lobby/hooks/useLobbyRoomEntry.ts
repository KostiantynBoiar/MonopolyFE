'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionDetail } from '@/shared/protocol/session';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';

interface UseLobbyRoomEntryOptions {
  hasActiveSession: boolean;
  join: (sessionId: string) => Promise<SessionDetail>;
  joinWithCode: (code: string) => Promise<SessionDetail>;
}

export function useLobbyRoomEntry({
  hasActiveSession,
  join,
  joinWithCode,
}: UseLobbyRoomEntryOptions) {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const resetSocket = useSocketStore((s) => s.reset);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isEnteringRoom, setIsEnteringRoom] = useState(false);

  const blocksRoomEntry = hasActiveSession && !isEnteringRoom;
  const canUseLobbyActions = !hasActiveSession && !isEnteringRoom;

  async function handleJoin(sessionId: string) {
    if (!canUseLobbyActions) return;
    setJoinError(null);
    setIsEnteringRoom(true);
    try {
      const session = await join(sessionId);
      enterRoom(session);
    } catch (err) {
      setJoinError((err as Error).message);
      setIsEnteringRoom(false);
    }
  }

  async function handleJoinByCode(code: string) {
    if (!canUseLobbyActions) return;
    setIsEnteringRoom(true);
    try {
      const session = await joinWithCode(code);
      enterRoom(session);
    } catch (err) {
      setIsEnteringRoom(false);
      throw err;
    }
  }

  function enterRoom(session: SessionDetail) {
    resetSocket();
    setSession(session);
    router.push(`/game/room/${session.id}`);
  }

  return {
    joinError,
    isEnteringRoom,
    blocksRoomEntry,
    canUseLobbyActions,
    clearJoinError: () => setJoinError(null),
    setIsEnteringRoom,
    handleJoin,
    handleJoinByCode,
  };
}
