'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { POLL_INTERVAL_MS } from '@/shared/config/constants';
import { joinByCode as joinByCodeApi, joinSession, listSessions } from '../api';
import type { SessionSummary } from '../lobby.types';

export function useLobby() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data.sessions);
      setNextCursor(data.next_cursor);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    pollRef.current = setInterval(() => fetch(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetch]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await listSessions(nextCursor);
      setSessions((prev) => [...prev, ...data.sessions]);
      setNextCursor(data.next_cursor);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, nextCursor]);

  const join = useCallback(async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      const { session } = await joinSession(sessionId);
      return session;
    } finally {
      setJoiningId(null);
    }
  }, []);

  const joinWithCode = useCallback(async (code: string) => {
    const { session } = await joinByCodeApi({ invite_code: code });
    return session;
  }, []);

  return {
    sessions,
    loading,
    error,
    joiningId,
    nextCursor,
    isLoadingMore,
    refresh: () => fetch(),
    loadMore,
    join,
    joinWithCode,
  };
}
