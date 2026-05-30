/**
 * Socket transport — routes commands over a real WebSocket and delivers server
 * messages asynchronously. Inactive by default (env.useMockBackend).
 *
 * Dependencies are injected (a command sender + a message subscription) rather than
 * reaching into GameSocket internals, so this stays decoupled and testable. When the
 * backend lands, wire these to GameSocket.sendCommand and the deserialized game frames
 * (see wsEventToServerMessage).
 */

import type { GameState } from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import type { ServerMessage } from '@/shared/protocol/network';
import type { GameTransport } from './GameTransport';

export type SocketTransportDeps = {
  sendCommand: (cmd: ClientCommand) => void;
  subscribe:   (cb: (msg: ServerMessage) => void) => () => void;
};

export class SocketTransport implements GameTransport {
  constructor(private readonly deps: SocketTransportDeps) {}

  send(_state: GameState, cmd: ClientCommand): ServerMessage[] {
    this.deps.sendCommand(cmd);
    return [];   // server responds asynchronously via onMessage
  }

  onMessage(cb: (msg: ServerMessage) => void): () => void {
    return this.deps.subscribe(cb);
  }
}
