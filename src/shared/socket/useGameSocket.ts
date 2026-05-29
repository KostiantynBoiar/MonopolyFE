'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '@/shared/config/env';
import { useSessionStore } from '@/stores/session-store';
import { useAuthStore } from '@/stores/auth-store';
import { MemberRole } from '@/features/lobby';
import { WsInboundType } from '@/shared/protocol/messages.schema';
import type {
  WsInbound,
  WsChatMessagePayload,
  WsChatStickerPayload,
  WsWelcomePayload,
  WsErrorPayload,
} from '@/shared/protocol/messages.schema';
import { GameSocket, type SocketStatus } from './GameSocket';

export type WsChatEntry =
  | { kind: 'chat';    id: string; from_user_id: string; display_name: string; text: string;        ts: string }
  | { kind: 'sticker'; id: string; from_user_id: string; display_name: string; sticker_url: string; ts: string };

export function useGameSocket(sessionId: string | null) {
  const { token } = useAuthStore();
  const { setSession } = useSessionStore();
  const viewerId = useAuthStore((s) => s.user?.id);

  const socketRef   = useRef<GameSocket | null>(null);
  const seqStartRef = useRef<number>(0);  // your_seq_start from system.welcome; for future seq replay

  const [status, setStatus]       = useState<SocketStatus>('connecting');
  const [messages, setMessages]   = useState<WsChatEntry[]>([]);
  const [wsError, setWsError]     = useState<WsErrorPayload | null>(null);
  const [wasKicked, setWasKicked] = useState(false);

  useEffect(() => {
    if (!sessionId || !token) return;

    const socket = new GameSocket(sessionId, token, env.wsUrl);
    socketRef.current = socket;

    const offStatus  = socket.onStatus(setStatus);
    const offMessage = socket.onMessage((msg: WsInbound) => {
      switch (msg.type) {

        case WsInboundType.SYSTEM_WELCOME: {
          const p = msg.payload as WsWelcomePayload;
          seqStartRef.current = p.your_seq_start;
          break;
        }

        case WsInboundType.CHAT_MESSAGE: {
          const p = msg.payload as WsChatMessagePayload;
          setMessages((prev) => [...prev, {
            kind: 'chat',
            id: p.message_id,
            from_user_id: p.from_user_id,
            display_name: p.display_name,
            text: p.text,
            ts: p.ts,
          }]);
          break;
        }

        case WsInboundType.CHAT_STICKER: {
          const p = msg.payload as WsChatStickerPayload;
          setMessages((prev) => [...prev, {
            kind: 'sticker',
            id: p.message_id,
            from_user_id: p.from_user_id,
            display_name: p.display_name,
            sticker_url: p.sticker_url,
            ts: p.ts,
          }]);
          break;
        }

        case WsInboundType.SESSION_UPDATED: {
          const updated = msg.payload.session;

          // ── Gap 2: detect kick — viewer no longer in members list ─────────
          if (viewerId && !updated.members.find((m) => m.user_id === viewerId)) {
            setWasKicked(true);
            return;
          }

          // your_role is always null in this broadcast; compute client-side
          const yourRole = viewerId
            ? (updated.members.find((m) => m.user_id === viewerId)?.role ?? null)
            : null;

          setSession({ ...updated, your_role: yourRole as MemberRole | null });
          break;
        }

        // ── Gap 1: surface server errors to the UI ─────────────────────────
        case WsInboundType.SYSTEM_ERROR: {
          const p = msg.payload as WsErrorPayload;
          setWsError(p);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  const sendChat    = useCallback((text: string) => socketRef.current?.sendChat(text),    []);
  const sendSticker = useCallback((url: string)  => socketRef.current?.sendSticker(url),  []);
  const clearWsError = useCallback(() => setWsError(null), []);

  return { status, messages, sendChat, sendSticker, wsError, clearWsError, wasKicked };
}
