'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listSessions, joinSession, joinByCode as joinByCodeApi } from '../api';
import { POLL_INTERVAL_MS } from '@/shared/config/constants';
import type { SessionSummary } from '../lobby.types';

export function useLobby(token: string | null, viewerId: string | undefined) {
  const [sessions, setSessions]       = useState<SessionSummary[]>([]);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [joiningId, setJoiningId]     = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always fetches page 1; replaces session list (used for initial load + polling)
  const fetch = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoading(true);
      try {
        const data = await listSessions(token);
        setSessions(data.sessions);
        setNextCursor(data.next_cursor);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetch();
    pollRef.current = setInterval(() => fetch(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetch]);

  // Appends the next page using the current cursor
  const loadMore = useCallback(async () => {
    if (!token || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await listSessions(token, nextCursor);
      setSessions((prev) => [...prev, ...data.sessions]);
      setNextCursor(data.next_cursor);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, nextCursor, isLoadingMore]);

  const join = useCallback(
    async (sessionId: string, viewerName: string) => {
      if (!token || !viewerId) throw new Error('Not authenticated');
      setJoiningId(sessionId);
      try {
        const { session } = await joinSession(token, sessionId, viewerId, viewerName);
        return session;
      } finally {
        setJoiningId(null);
      }
    },
    [token, viewerId],
  );

  const joinWithCode = useCallback(
    async (code: string, viewerName: string) => {
      if (!token || !viewerId) throw new Error('Not authenticated');
      const { session } = await joinByCodeApi(token, { invite_code: code }, viewerId, viewerName);
      return session;
    },
    [token, viewerId],
  );

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
