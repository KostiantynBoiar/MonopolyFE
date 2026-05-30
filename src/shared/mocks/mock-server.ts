/**
 * Mock server.
 * Wraps processCommand, computes permissions, and emits typed ServerMessages.
 * When the real backend ships, swap this for a GameSocket.send() call.
 */

import type { GameState, LogEntry } from '@/shared/protocol/game-state';
import { TurnPhase, LogKind, AuctionTargetKind } from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import type { ServerMessage, SnapshotMessage, PatchMessage, LogMessage } from '@/shared/protocol/network';
import { ServerEventType } from '@/shared/protocol/network';
import { BOARD } from '@/shared/config/board-layout';
import { processCommand } from './command-processor';
import { computePermissions } from './compute-permissions';

// ── Sequence counter ──────────────────────────────────────────────────────────

let _seq = 0;
const nextSeq = () => ++_seq;

// ── Message factories ─────────────────────────────────────────────────────────

export function makeSnapshot(game: GameState): SnapshotMessage {
  return {
    type:        ServerEventType.Snapshot,
    seq:         nextSeq(),
    game,
    permissions: computePermissions(game),
  };
}

export function makePatch(delta: Partial<GameState>): PatchMessage {
  return { type: ServerEventType.Patch, seq: nextSeq(), delta };
}

export function makeLog(entries: LogEntry[]): LogMessage {
  return { type: ServerEventType.Log, seq: nextSeq(), entries };
}

// ── Command dispatch ──────────────────────────────────────────────────────────

export function dispatchToMockServer(
  state: GameState,
  cmd: ClientCommand,
): ServerMessage[] {
  const next = processCommand(state, cmd);
  if (next === state) return [];

  const newEntries = next.log.slice(state.log.length);
  const messages: ServerMessage[] = [];

  if (newEntries.length > 0) messages.push(makeLog(newEntries));
  messages.push(makeSnapshot(next));
  return messages;
}

// ── Server-initiated events ───────────────────────────────────────────────────

export function tickAuction(
  state: GameState,
  elapsedMs: number,
  bobBidFired: boolean,
): { messages: ServerMessage[]; bobBidFired: boolean } {
  if (!state.auction || state.turn.phase !== TurnPhase.AUCTION) {
    return { messages: [], bobBidFired };
  }

  const newTime = Math.max(0, state.auction.timeRemainingMs - elapsedMs);
  const messages: ServerMessage[] = [];
  let nextBobBidFired = bobBidFired;
  let next: GameState = { ...state, auction: { ...state.auction, timeRemainingMs: newTime } };

  if (newTime <= 7000 && !bobBidFired) {
    nextBobBidFired = true;
    const aTarget    = state.auction.target;
    const auctionPos = aTarget.kind === AuctionTargetKind.PROPERTY ? aTarget.position : -1;
    const property   = BOARD[auctionPos] as { price?: number } | undefined;
    const bobBid     = Math.floor((property?.price ?? 100) / 2);
    const bob        = state.players.find((p) => p.id === 'bob');

    if (bob && bobBid > state.auction.highestBid) {
      const entry: LogEntry = {
        id: `log_bid_bob_${Date.now()}`, kind: LogKind.EVENT,
        text: `Bob bids M${bobBid}.`, ts: new Date().toISOString(),
      };
      next = {
        ...next,
        auction: {
          ...next.auction!,
          bids:            [...next.auction!.bids, { playerId: 'bob', amount: bobBid }],
          highestBid:      bobBid,
          highestBidderId: 'bob',
        },
        log: [...next.log, entry],
      };
      messages.push(makeLog([entry]));
    }
  }

  if (newTime <= 0) {
    const winner    = next.auction!.highestBidderId;
    const winAmount = next.auction!.highestBid;
    const pos       = next.auction!.target.kind === AuctionTargetKind.PROPERTY
      ? next.auction!.target.position : -1;
    const winnerName = next.players.find((p) => p.id === winner)?.displayName ?? winner ?? 'Nobody';
    const logText = winner
      ? `${winnerName} won the auction for M${winAmount}.`
      : 'No bids. Property returns to the bank.';

    const entry: LogEntry = {
      id: `log_auction_end_${Date.now()}`, kind: LogKind.EVENT,
      text: logText, ts: new Date().toISOString(),
    };

    // Only deduct balance and assign ownership when there was a valid property position.
    // Non-PROPERTY auctions (house/hotel supply) set pos = -1: skip both mutations.
    const isPropertyAuction = pos !== -1;
    const resolved: GameState = {
      ...next,
      players: winner && isPropertyAuction
        ? next.players.map((p) =>
            p.id === winner ? { ...p, balance: p.balance - winAmount } : p,
          )
        : next.players,
      spaces: isPropertyAuction
        ? next.spaces.map((s, i) =>
            i === pos ? { ...s, ownerId: winner ?? null } : s,
          )
        : next.spaces,
      auction: null,
      turn: { ...next.turn, phase: TurnPhase.POST_ROLL },
      log: [...next.log, entry],
    };

    messages.push(makeLog([entry]));
    messages.push(makeSnapshot(resolved));
    return { messages, bobBidFired: nextBobBidFired };
  }

  messages.push(makePatch({ auction: next.auction! }));
  return { messages, bobBidFired: nextBobBidFired };
}

export function advanceTurnEvent(state: GameState): SnapshotMessage {
  return makeSnapshot(processCommand(state, { type: CommandType.EndTurn }));
}

export function startAuctionEvent(state: GameState, position: number): SnapshotMessage {
  const entry: LogEntry = {
    id: `log_auction_start_${Date.now()}`, kind: LogKind.EVENT,
    text: `${BOARD[position]?.name ?? `#${position}`} goes to auction!`,
    ts: new Date().toISOString(),
  };
  const next: GameState = {
    ...state,
    auction: {
      target:          { kind: AuctionTargetKind.PROPERTY, position },
      bids:            [],
      highestBid:      0,
      highestBidderId: null,
      timeRemainingMs: 10_000,
    },
    turn: { ...state.turn, phase: TurnPhase.AUCTION },
    log:  [...state.log, entry],
  };
  return makeSnapshot(next);   // computePermissions sets canBidAuction:true
}

export function resetViewerTurnEvent(state: GameState): SnapshotMessage {
  const next: GameState = {
    ...state,
    turn: { ...state.turn, phase: TurnPhase.PRE_ROLL, diceRoll: null },
  };
  return makeSnapshot(next);   // computePermissions sets canRoll:true
}
