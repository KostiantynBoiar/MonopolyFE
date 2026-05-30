import { create } from 'zustand';
import type { SocketStatus } from '@/shared/socket/GameSocket';
import type { WsErrorPayload } from '@/shared/protocol/messages.schema';

// ── Chat entry type lives here so socket hook and consumers share one definition.
export type WsChatEntry =
  | { kind: 'chat';    id: string; from_user_id: string; display_name: string; text: string;        ts: string }
  | { kind: 'sticker'; id: string; from_user_id: string; display_name: string; sticker_url: string; ts: string };

interface SocketStore {
  // Connection
  status:            SocketStatus;
  latency:           number | null;    // last ping-pong round-trip in ms
  reconnectAttempts: number;

  // Error / kick
  wsError:   WsErrorPayload | null;
  wasKicked: boolean;

  // Lobby chat (arrives over WS before game starts)
  messages: WsChatEntry[];

  // Actions
  setStatus:          (status: SocketStatus) => void;
  setLatency:         (ms: number | null) => void;
  incrementReconnect: () => void;
  resetReconnect:     () => void;
  setWsError:         (err: WsErrorPayload | null) => void;
  clearWsError:       () => void;
  setWasKicked:       (kicked: boolean) => void;
  addMessage:         (msg: WsChatEntry) => void;
  reset:              () => void;
}

const INITIAL: Pick<SocketStore,
  'status' | 'latency' | 'reconnectAttempts' | 'wsError' | 'wasKicked' | 'messages'
> = {
  status:            'connecting',
  latency:           null,
  reconnectAttempts: 0,
  wsError:           null,
  wasKicked:         false,
  messages:          [],
};

export const useSocketStore = create<SocketStore>((set) => ({
  ...INITIAL,

  setStatus:          (status) => set({ status }),
  setLatency:         (ms)     => set({ latency: ms }),
  incrementReconnect: ()       => set((s) => ({ reconnectAttempts: s.reconnectAttempts + 1 })),
  resetReconnect:     ()       => set({ reconnectAttempts: 0 }),
  setWsError:         (err)    => set({ wsError: err }),
  clearWsError:       ()       => set({ wsError: null }),
  setWasKicked:       (kicked) => set({ wasKicked: kicked }),
  addMessage:         (msg)    => set((s) => ({ messages: [...s.messages, msg] })),
  reset:              ()       => set({ ...INITIAL }),
}));
