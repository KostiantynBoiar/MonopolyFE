import { env } from '@/shared/config/env';
import type { GameTransport } from './GameTransport';
import { MockTransport } from './MockTransport';
import { SocketTransport, type SocketTransportDeps } from './SocketTransport';

export type { GameTransport } from './GameTransport';
export { MockTransport } from './MockTransport';
export { SocketTransport } from './SocketTransport';
export type { SocketTransportDeps } from './SocketTransport';
export { wsEventToServerMessage } from './ws-adapter';

/**
 * Build the active transport. Mock by default; the real socket is selected only when
 * env.useMockBackend is false AND socket deps are supplied (wired once the backend lands).
 */
export function createTransport(socketDeps?: SocketTransportDeps): GameTransport {
  if (!env.useMockBackend && socketDeps) {
    return new SocketTransport(socketDeps);
  }
  return new MockTransport();
}
