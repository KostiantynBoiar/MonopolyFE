'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinByCode } from '@/shared/api/sessions';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { MessageScreen } from '@/shared/ui/MessageScreen';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';

/**
 * Entry point for `/game/room`. The room itself lives at the canonical,
 * reconnect-safe `/game/room/[sessionId]` route — this page only resolves how
 * the player arrived:
 *   • `?code=TYC-XXXX`  → join by invite code, then redirect to the session id.
 *   • a persisted session → redirect to it (e.g. the lobby "Back to game" link).
 *   • otherwise          → back to the lobby.
 */
export default function GameRoomEntry() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const currentSession = useSessionStore((s) => s.currentSession);
  const hasHydrated = useSessionStore((s) => s._hasHydrated);
  const setSession = useSessionStore((s) => s.setSession);
  const resetSocket = useSocketStore((s) => s.reset);

  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!ready || !hasHydrated || handled.current) return;
    handled.current = true;

    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      joinByCode({ invite_code: code })
        .then(({ session }) => {
          resetSocket();
          setSession(session);
          router.replace(`/game/room/${session.id}`);
        })
        .catch((err) => setError((err as Error).message));
      return;
    }

    if (currentSession) {
      router.replace(`/game/room/${currentSession.id}`);
    } else {
      router.replace('/lobby');
    }
  }, [currentSession, hasHydrated, ready, resetSocket, router, setSession]);

  if (error) {
    return (
      <MessageScreen
        tone="error"
        title="Could not join room"
        message={error}
        action={{ label: 'Back to lobby', href: '/lobby' }}
      />
    );
  }

  return <FullScreenSpinner />;
}
