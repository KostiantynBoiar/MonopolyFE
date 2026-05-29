'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '@/shared/config/env';
import { useSessionStore } from '@/stores/session-store';
import { useAuthStore } from '@/stores/auth-store';
import { MemberRole } from '@/features/lobby';
import { WsInboundType } from '@/shared/protocol/messages.schema';
import type { WsInbound, WsChatMessagePayload, WsChatStickerPayload } from '@/shared/protocol/messages.schema';
import { GameSocket, type SocketStatus } from './GameSocket';

export type WsChatEntry =
  | { kind: 'chat';    id: string; from_user_id: string; display_name: string; text: string;        ts: string }
  | { kind: 'sticker'; id: string; from_user_id: string; display_name: string; sticker_url: string; ts: string };

export function useGameSocket(sessionId: string | null) {
  const { token } = useAuthStore();
  const { currentSession, setSession } = useSessionStore();
  const viewerId = useAuthStore((s) => s.user?.id);

  const socketRef = useRef<GameSocket | null>(null);
  const [status, setStatus]     = useState<SocketStatus>('connecting');
  const [messages, setMessages] = useState<WsChatEntry[]>([]);

  useEffect(() => {
    if (!sessionId || !token) return;

    const socket = new GameSocket(sessionId, token, env.wsUrl);
    socketRef.current = socket;

    const offStatus  = socket.onStatus(setStatus);
    const offMessage = socket.onMessage((msg: WsInbound) => {
      switch (msg.type) {
        case WsInboundType.CHAT_MESSAGE: {
          const p = msg.payload as WsChatMessagePayload;
          setMessages((prev) => [...prev, { kind: 'chat', id: p.message_id, from_user_id: p.from_user_id, display_name: p.display_name, text: p.text, ts: p.ts }]);
          break;
        }
        case WsInboundType.CHAT_STICKER: {
          const p = msg.payload as WsChatStickerPayload;
          setMessages((prev) => [...prev, { kind: 'sticker', id: p.message_id, from_user_id: p.from_user_id, display_name: p.display_name, sticker_url: p.sticker_url, ts: p.ts }]);
          break;
        }
        case WsInboundType.SESSION_UPDATED: {
          const updated = msg.payload.session;
          // your_role is always null in the broadcast; compute from members
          const yourRole = viewerId
            ? (updated.members.find((m) => m.user_id === viewerId)?.role ?? null)
            : null;
          setSession({ ...updated, your_role: yourRole as MemberRole | null });
          break;
        }
        default:
          break;
      }
    });

    socket.connect();

    return () => {
      offStatus();
      offMessage();
      socket.destroy();
      socketRef.current = null;
    };
  // Re-connect when session or token changes; viewerId and setSession are stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  const sendChat    = useCallback((text: string)    => socketRef.current?.sendChat(text),    []);
  const sendSticker = useCallback((url: string)     => socketRef.current?.sendSticker(url),  []);

  return { status, messages, sendChat, sendSticker };
}
