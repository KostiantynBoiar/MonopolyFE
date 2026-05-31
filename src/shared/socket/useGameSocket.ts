'use client';

import { useCallback, useEffect, useRef } from 'react';
import { env } from '@/shared/config/env';
import { useSessionStore } from '@/stores/session-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSocketStore } from '@/stores/socket-store';
import { MemberRole } from '@/features/lobby';
import { WsInboundType } from '@/shared/protocol/messages.schema';
import type {
  WsInbound,
  WsChatMessagePayload,
  WsChatStickerPayload,
  WsWelcomePayload,
  WsErrorPayload,
} from '@/shared/protocol/messages.schema';
import type { ClientCommand } from '@/shared/protocol/commands';
import { adaptGameStateFrame, type BeGameState } from '@/shared/transport/state-adapter';
import { serializeCommand } from '@/shared/transport/command-serializer';
import { enqueueSnapshot, resetSnapshotPipeline } from './snapshot-animator';
import { useCommandBus } from '@/stores/command-bus';
import { useUiStore } from '@/stores/ui-store';
import { GameSocket } from './GameSocket';

export function useGameSocket(sessionId: string | null) {
  const { token } = useAuthStore();
  const { setSession } = useSessionStore();
  const viewerId = useAuthStore((s) => s.user?.id);

  const {
    setStatus, setWsError, setWasKicked, addMessage,
    incrementReconnect, resetReconnect,
  } = useSocketStore();
  const setSendCommand = useCommandBus((s) => s.setSendCommand);

  const socketRef   = useRef<GameSocket | null>(null);
  const seqStartRef = useRef<number>(0);

  useEffect(() => {
    if (!sessionId || !token) return;

    const socket = new GameSocket(sessionId, token, env.wsUrl);
    socketRef.current = socket;

    const offStatus = socket.onStatus((status) => {
      setStatus(status);
      if (status === 'connecting') incrementReconnect();
      if (status === 'open')      resetReconnect();
    });

    const offMessage = socket.onMessage((msg: WsInbound) => {
      switch (msg.type) {

        case WsInboundType.SYSTEM_WELCOME: {
          const p = msg.payload as WsWelcomePayload;
          seqStartRef.current = p.your_seq_start;
          break;
        }

        case WsInboundType.CHAT_MESSAGE: {
          const p = msg.payload as WsChatMessagePayload;
          addMessage({
            kind: 'chat',
            id:           p.message_id,
            from_user_id: p.from_user_id,
            display_name: p.display_name,
            text:         p.text,
            ts:           p.ts,
          });
          break;
        }

        case WsInboundType.CHAT_STICKER: {
          const p = msg.payload as WsChatStickerPayload;
          addMessage({
            kind: 'sticker',
            id:           p.message_id,
            from_user_id: p.from_user_id,
            display_name: p.display_name,
            sticker_url:  p.sticker_url,
            ts:           p.ts,
          });
          break;
        }

        case WsInboundType.SESSION_UPDATED: {
          const updated = msg.payload.session;

          if (viewerId && !updated.members.find((m) => m.user_id === viewerId)) {
            setWasKicked(true);
            return;
          }

          const yourRole = viewerId
            ? (updated.members.find((m) => m.user_id === viewerId)?.role ?? null)
            : null;

          setSession({ ...updated, your_role: yourRole as MemberRole | null });
          break;
        }

        case WsInboundType.GAME_STATE: {
          // Server-authoritative full snapshot. Translate then hand to the animation
          // pipeline, which diffs against the committed state and commits to the store.
          const snapshot = adaptGameStateFrame(msg.payload as unknown as BeGameState);
          enqueueSnapshot(snapshot);
          break;
        }

        case WsInboundType.SYSTEM_ERROR: {
          const p = msg.payload as WsErrorPayload;
          setWsError(p);
          // A rejected command (e.g. illegal move) means no snapshot is coming, so
          // release any optimistic rolling lock the dispatcher set.
          useUiStore.getState().setIsRolling(false);
          break;
        }

        default:
          break;
      }
    });

    socket.connect();

    // Publish the live command sender so the dispatch layer can reach this socket.
    setSendCommand((cmd: ClientCommand) => {
      const wire = serializeCommand(cmd);
      if (wire) socket.sendCommand(wire.type, wire.payload);
    });

    return () => {
      offStatus();
      offMessage();
      socket.destroy();
      socketRef.current = null;
      setSendCommand(null);
      resetSnapshotPipeline();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  const sendChat    = useCallback((text: string) => socketRef.current?.sendChat(text),   []);
  const sendSticker = useCallback((url: string)  => socketRef.current?.sendSticker(url), []);

  return { sendChat, sendSticker };
}
