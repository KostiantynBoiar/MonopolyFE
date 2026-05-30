/**
 * Adapter from the WebSocket wire DTO (events.ts ServerEvent) to the canonical
 * internal ServerMessage (network/index.ts). applyMessage stays the single fold
 * point regardless of backend — the wire format maps into it here.
 *
 * Connection-level events (Welcome, Ping, PermissionsUpdated) are handled by the
 * socket layer, not the game reducer, so they map to null.
 */

import type { ServerEvent } from '@/shared/protocol/events';
import { ServerEventType as WsEventType } from '@/shared/protocol/events';
import type { ServerMessage } from '@/shared/protocol/network';
import { ServerEventType as MsgType } from '@/shared/protocol/network';

export function wsEventToServerMessage(event: ServerEvent): ServerMessage | null {
  switch (event.type) {
    case WsEventType.GameSnapshot:
      return {
        type:        MsgType.Snapshot,
        seq:         event.seq ?? 0,
        game:        event.payload.state,
        permissions: event.payload.permissions,
      };

    case WsEventType.Error:
      return {
        type:    MsgType.Error,
        code:    'internal',
        message: event.payload.message,
        refSeq:  event.payload.ref_seq,
      };

    // Welcome / Ping / PermissionsUpdated are connection-level, not game-state folds.
    default:
      return null;
  }
}
