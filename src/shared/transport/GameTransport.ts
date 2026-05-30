/**
 * Transport seam between the dispatch layer and the game backend.
 *
 * The mock and a real WebSocket are interchangeable behind this interface, so
 * flipping backends is a single config switch (env.useMockBackend). The frontend
 * dispatch loop only knows about ClientCommand → ServerMessage[]; it never knows
 * whether those messages came from the in-process mock or the wire.
 */

import type { GameState } from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import type { ServerMessage } from '@/shared/protocol/network';

export interface GameTransport {
  /**
   * Send a command.
   *
   * Mock: processes synchronously and returns the resulting ServerMessages, so the
   * dispatch layer can drive animations immediately.
   * Real socket: sends over the wire and returns [] — messages arrive later via onMessage.
   */
  send(state: GameState, cmd: ClientCommand): ServerMessage[];

  /** Subscribe to asynchronously-delivered server messages (real socket). Returns an unsubscribe fn. */
  onMessage(cb: (msg: ServerMessage) => void): () => void;
}
