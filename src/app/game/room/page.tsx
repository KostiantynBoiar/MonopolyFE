'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BoardContainer } from '@/features/game-board';
import { WaitingActionsPanel, WaitingChatPanel, WaitingInviteCodePanel, SessionStatus } from '@/features/lobby';
import { joinByCode, leaveSession, startGame } from '@/features/lobby/api';
import type { SessionMember } from '@/features/lobby';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useSessionStore, useSocketStore } from '@/stores';
import { useGameSocket } from '@/shared/socket';
import type { Player } from '@/features/player-panel';
import type { ChatMessage } from '@/features/chat/chat.types';
import { TOKEN_ORDER } from '@/shared/config/constants';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import { GameBoard } from './GameBoard';

// ─── Adapter ───────────────────────────────────────────────────────────────────

function sessionMembersToPlayers(members: SessionMember[]): Player[] {
  return members.map((m, i) => ({
    id:             m.user_id,
    name:           m.display_name,
    balance:        0,
    position:       0,
    token:          TOKEN_ORDER[i % TOKEN_ORDER.length],
    ownedPositions: [],
    isActive:       false,
    isBankrupt:     false,
    inJail:         false,
  }));
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function GameRoomPage() {
  const router = useRouter();
  const { ready, token, user } = useRequireAuth();
  const { currentSession, clearSession, setSession, _hasHydrated: sessionHydrated } = useSessionStore();
  const [resolvingCode, setResolvingCode] = useState(false);

  const {
    status: socketStatus,
    messages: wsMessages,
    wsError,
    wasKicked,
    clearWsError,
  } = useSocketStore();

  const { sendChat, sendSticker } = useGameSocket(currentSession?.id ?? null);

  // ── Session setup & lifecycle management ────────────────────────────────────

  useEffect(() => {
    if (!wasKicked) return;
    clearSession();
    router.push('/lobby?kicked=1');
  }, [wasKicked, clearSession, router]);

  useEffect(() => {
    if (!ready || !sessionHydrated || resolvingCode || currentSession) return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) return;
    router.replace('/lobby');
  }, [ready, sessionHydrated, resolvingCode, currentSession, router]);

  useEffect(() => {
    if (!ready || !token || currentSession) return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    setResolvingCode(true);
    let cancelled = false;
    joinByCode({ invite_code: code })
      .then(({ session }) => { if (!cancelled) setSession(session); })
      .catch((err) => {
        if (!cancelled) router.replace(`/lobby?error=${encodeURIComponent((err as Error).message)}`);
      })
      .finally(() => { if (!cancelled) setResolvingCode(false); });
    return () => { cancelled = true; };
  }, [ready, token, currentSession, user, setSession, router]);

  useEffect(() => {
    if (!wsError) return;
    const t = setTimeout(clearWsError, 6_000);
    return () => clearTimeout(t);
  }, [wsError, clearWsError]);

  // ── Waiting room state ──────────────────────────────────────────────────────

  const isWaiting = currentSession?.status === SessionStatus.WAITING;

  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const waitingMessages: ChatMessage[] = wsMessages.map((m) => ({
    id:     m.id,
    kind:   'chat',
    author: m.display_name,
    text:   m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
    ts:     new Date(m.ts).getTime(),
  }));

  function handleWaitingMessage(text: string) {
    const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);
    stickerMatch ? sendSticker(stickerMatch[1]) : sendChat(text);
  }

  async function handleLeave() {
    setIsLeaving(true);
    if (currentSession) await leaveSession(currentSession.id);
    clearSession();
    router.push('/lobby');
  }

  async function handleStart() {
    setIsStarting(true);
    if (currentSession) {
      await startGame(currentSession.id);
      setSession({ ...currentSession, status: SessionStatus.IN_PROGRESS });
    }
    setIsStarting(false);
  }

  // ── Render logic ────────────────────────────────────────────────────────────

  if (!ready || resolvingCode) return <FullScreenSpinner />;

  if (isWaiting && currentSession) {
    const sidebarPlayers = sessionMembersToPlayers(currentSession.members);

    return (
      <div className="relative flex h-screen overflow-hidden bg-paper">
        <WsErrorBanner error={wsError} onDismiss={clearWsError} />
        <div className="flex-1 overflow-hidden">
          <BoardContainer
            sidebarPlayers={sidebarPlayers}
            centerSlots={{
              actions: (
                <WaitingActionsPanel
                  session={currentSession}
                  onLeave={handleLeave}
                  onStart={handleStart}
                  isLeaving={isLeaving}
                  isStarting={isStarting}
                />
              ),
              chat: (
                <WaitingChatPanel
                  messages={waitingMessages}
                  onSendMessage={handleWaitingMessage}
                  socketStatus={socketStatus}
                />
              ),
              deed: (
                <WaitingInviteCodePanel
                  session={currentSession}
                />
              ),
            }}
          />
        </div>
      </div>
    );
  }

  return <GameBoard wsError={wsError} onClearWsError={clearWsError} onSendChat={handleWaitingMessage} />;
}
