import { create } from 'zustand';
import type { ClientCommand } from '@/shared/protocol/commands';

/**
 * Command bus — decouples the dispatch layer from the live socket.
 *
 * `useGameSocket` publishes the active `sendCommand` here when the connection is
 * open; `useGameDispatch` reads it to forward commands. This mirrors the codebase's
 * store-driven wiring (no prop threading, no context) and means dispatch works
 * regardless of where the socket happens to be mounted. `sendCommand` is null while
 * disconnected, so callers no-op safely.
 */
interface CommandBusStore {
  sendCommand: ((cmd: ClientCommand) => void) | null;
  setSendCommand: (fn: ((cmd: ClientCommand) => void) | null) => void;
}

export const useCommandBus = create<CommandBusStore>((set) => ({
  sendCommand: null,
  setSendCommand: (fn) => set({ sendCommand: fn }),
}));
