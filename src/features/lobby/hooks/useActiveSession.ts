'use client';

import { useEffect, useState } from 'react';
import { getSession } from '../api';
import { SessionStatus } from '../lobby.enums';
import type { SessionDetail } from '../lobby.types';
import { useSessionStore } from '@/stores/session-store';

export interface ActiveSession {
  /** The validated session you currently belong to and can rejoin, or null. */
  session: SessionDetail | null;
  /** True until the persisted session has been validated against the server. */
  checking: boolean;
}

/**
 * A session is rejoinable only if it still exists, has not finished, we are
 * still a member, and we haven't gone bankrupt in it (game still ongoing).
 */
function isRejoinable(session: SessionDetail, viewerBankrupt: boolean): boolean {
  return session.status !== SessionStatus.FINISHED && session.your_role !== null && !viewerBankrupt;
}

/**
 * Validates the persisted "current session" pointer against the server before
 * the lobby offers a "Back to game" shortcut. The persisted value can be stale
 * — the game may have finished, we may have been removed, or we went bankrupt
 * while the game continued — so we re-fetch it and drop the pointer when it is
 * no longer rejoinable.
 */
export function useActiveSession(ready: boolean): ActiveSession {
  const persistedId = useSessionStore((s) => s.currentSession?.id ?? null);
  const hasHydrated = useSessionStore((s) => s._hasHydrated);
  const viewerBankruptInSession = useSessionStore((s) => s.viewerBankruptInSession);
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  const [session, setActive] = useState<SessionDetail | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!ready || !hasHydrated) return;

    let alive = true;

    const validateSession = async () => {
      await Promise.resolve();
      if (!alive) return;

      if (!persistedId) {
        setActive(null);
        setChecking(false);
        return;
      }

      setChecking(true);

      getSession(persistedId)
        .then(({ session: fresh }) => {
          if (!alive) return;
          if (isRejoinable(fresh, viewerBankruptInSession)) {
            setSession(fresh);
            setActive(fresh);
          } else {
            clearSession();
            setActive(null);
          }
        })
        .catch(() => {
          // Session no longer exists / not accessible → drop the stale pointer.
          if (!alive) return;
          clearSession();
          setActive(null);
        })
        .finally(() => {
          if (alive) setChecking(false);
        });
    };

    void validateSession();

    return () => {
      alive = false;
    };
  }, [ready, hasHydrated, persistedId, viewerBankruptInSession, setSession, clearSession]);

  return { session, checking };
}
