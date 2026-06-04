import { backoffDelay } from './reconnect';
import {
  WsInboundType,
  buildPong,
  buildChatSend,
  buildStickerSend,
  buildGameCommand,
} from '@/shared/protocol/messages.schema';
import type { WsInbound } from '@/shared/protocol/messages.schema';

// Server sends ping every 20 s; we must pong within 25 s.
const PING_TIMEOUT_MS   = 25_000;
const MAX_RECONNECT_ATTEMPTS = 8;

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'error';

type MessageHandler   = (msg: WsInbound) => void;
type StatusHandler    = (status: SocketStatus) => void;

export class GameSocket {
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private destroyed = false;

  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers  = new Set<StatusHandler>();

  constructor(
    private readonly sessionId: string,
    private readonly token: string,
    private readonly wsBase: string,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  connect() {
    this.destroyed = false;
    this._open();
  }

  destroy() {
    this.destroyed = true;
    this._clearTimers();
    this.ws?.close(1000, 'client destroy');
    this.ws = null;
  }

  sendChat(text: string) {
    this._send(buildChatSend(text));
  }

  sendSticker(url: string) {
    this._send(buildStickerSend(url));
  }

  /** Send a serialized game command ({ type, payload } from the command serializer). */
  sendCommand(type: string, payload: Record<string, unknown>) {
    this._send(buildGameCommand(type, payload));
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  private _open() {
    this._emitStatus('connecting');
    const url = `${this.wsBase}/ws/sessions/${this.sessionId}`;
    // Auth via subprotocol header: Sec-WebSocket-Protocol: bearer,<token>
    this.ws = new WebSocket(url, ['bearer', this.token]);

    this.ws.onopen = () => {
      this.attempt = 0;
      this._emitStatus('open');
    };

    this.ws.onmessage = (ev) => {
      let msg: WsInbound;
      try {
        msg = JSON.parse(ev.data as string) as WsInbound;
      } catch {
        return;
      }

      // Auto-pong and reset ping watchdog
      if (msg.type === WsInboundType.CONNECTION_PING) {
        this._resetPingTimer();
        this._send(buildPong());
        return;
      }

      this.messageHandlers.forEach((h) => h(msg));
    };

    this.ws.onerror = () => {
      this._emitStatus('error');
    };

    this.ws.onclose = (ev) => {
      this._clearTimers();
      // 4401 / 4403 / 4400 — auth/membership/version errors; don't reconnect
      const fatal = ev.code === 4401 || ev.code === 4403 || ev.code === 4400;
      if (this.destroyed || fatal) {
        this._emitStatus('closed');
        return;
      }
      this._scheduleReconnect();
    };

    this._resetPingTimer();
  }

  private _send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private _resetPingTimer() {
    if (this.pingTimer) clearTimeout(this.pingTimer);
    this.pingTimer = setTimeout(() => {
      // No ping received in time — connection is stale, force-close so onclose triggers reconnect
      this.ws?.close(1001, 'ping timeout');
    }, PING_TIMEOUT_MS);
  }

  private _scheduleReconnect() {
    if (this.attempt >= MAX_RECONNECT_ATTEMPTS) {
      this._emitStatus('closed');
      return;
    }
    const delay = backoffDelay(this.attempt++);
    this._emitStatus('connecting');
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this._open();
    }, delay);
  }

  private _clearTimers() {
    if (this.pingTimer)     { clearTimeout(this.pingTimer);     this.pingTimer = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  private _emitStatus(status: SocketStatus) {
    this.statusHandlers.forEach((h) => h(status));
  }
}
