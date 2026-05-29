'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listSessions, joinSession, joinByCode as joinByCodeApi } from '../api';
import type { SessionSummary } from '../lobby.types';

const POLL_INTERVAL_MS = 10_000;

export function useLobby(token: string | null, viewerId: string | undefined) {
  const [sessions, setSessions]   = useState<SessionSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoading(true);
      try {
        const data = await listSessions(token);
        setSessions(data.sessions);
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

  return { sessions, loading, error, joiningId, refresh: () => fetch(), join, joinWithCode };
}
