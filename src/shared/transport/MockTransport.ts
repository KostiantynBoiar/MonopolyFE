/**
 * Mock transport — wraps the in-process mock server. The default backend.
 * send() processes the command synchronously and returns the resulting messages;
 * there is no async push (server-initiated events like auction ticks and opponent
 * turns are driven by page effects), so onMessage is a no-op subscription.
 */

import type { GameState } from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import type { ServerMessage } from '@/shared/protocol/network';
import { dispatchToMockServer } from '@/shared/mocks/mock-server';
import type { GameTransport } from './GameTransport';

export class MockTransport implements GameTransport {
  send(state: GameState, cmd: ClientCommand): ServerMessage[] {
    return dispatchToMockServer(state, cmd);
  }

  onMessage(): () => void {
    return () => {};
  }
}
