/**
 * Movement & landing resolution — the engine that every movement plugs into.
 *
 * applyMovement is the SINGLE chokepoint for changing a player's position, so the
 * GO bonus lives in exactly one place (dice rolls AND card teleports use it).
 * resolveLanding inspects the destination and applies rent / tax / jail / card draw.
 *
 * Pure functions: (GameState, …) → GameState (with log entries appended and phase set).
 * Used by command-processor (RollDice) and resolve-card-effect (teleports).
 */

import type { GameState, GameEvent } from '@/shared/protocol/game-state';
import {
  TurnPhase, GameEventType, DebtCreditorType,
} from '@/shared/protocol/game-state';
import { appendEvents } from '@/shared/protocol/log';
import { getOwner, isMortgaged, getPropertyRent } from '@/shared/protocol/selectors';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType, CornerVariant } from '@/features/game-board/game-board.enums';

const GO_BONUS = 200;
const JAIL_POSITION = 10;

// ── Local helpers ───────────────────────────────────────────────────────────

const spaceName = (pos: number) => BOARD[pos]?.name ?? `#${pos}`;

export function nameOf(state: GameState, playerId: string): string {
  return state.players.find((p) => p.id === playerId)?.displayName ?? 'Player';
}

/** Append typed events to the log, returning new state. Shared with the card resolver. */
export function logEvents(state: GameState, ...events: GameEvent[]): GameState {
  return { ...state, log: appendEvents(state.log, ...events) };
}

export function addBalance(state: GameState, playerId: string, delta: number): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, balance: p.balance + delta } : p,
    ),
  };
}

function balanceOf(state: GameState, playerId: string): number {
  return state.players.find((p) => p.id === playerId)?.balance ?? 0;
}

/**
 * Charge `amount` from debtor to creditor (or the bank when creditorId is null).
 * Solvent → transfer immediately. Insolvent → record state.debt and enter
 * MUST_PAY_RENT (Phase 17 resolves via raise-cash / bankruptcy).
 */
export function chargePlayer(
  state: GameState,
  debtorId: string,
  amount: number,
  creditorId: string | null,
): GameState {
  if (balanceOf(state, debtorId) >= amount) {
    let next = addBalance(state, debtorId, -amount);
    if (creditorId) next = addBalance(next, creditorId, amount);
    return next;
  }

  // Cannot cover — record the debt; resolution happens in Phase 17.
  return {
    ...logEvents(state, {
      type: GameEventType.DebtIncurred,
      debtorId, debtorName: nameOf(state, debtorId), creditorId, amount,
    }),
    debt: {
      debtorId,
      creditorType: creditorId ? DebtCreditorType.PLAYER : DebtCreditorType.BANK,
      creditorId,
      amount,
    },
    turn: { ...state.turn, phase: TurnPhase.MUST_PAY_RENT },
  };
}

// ── Movement ────────────────────────────────────────────────────────────────

/**
 * Move a player to `targetPos`. When `collectGo` is true, add the GO bonus.
 * Emits PlayerMoved (with passedGo/teleport flags) and, if applicable, PassedGo.
 */
export function applyMovement(
  state: GameState,
  playerId: string,
  targetPos: number,
  opts: { collectGo: boolean; teleport: boolean },
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;
  const from = player.position;

  let next: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, position: targetPos } : p,
    ),
  };

  next = logEvents(next, {
    type: GameEventType.PlayerMoved,
    playerId, playerName: player.displayName,
    from, to: targetPos, toName: spaceName(targetPos),
    passedGo: opts.collectGo, teleport: opts.teleport,
  });

  if (opts.collectGo) {
    next = addBalance(next, playerId, GO_BONUS);
    next = logEvents(next, {
      type: GameEventType.PassedGo, playerId, playerName: player.displayName, amount: GO_BONUS,
    });
  }

  return next;
}

/** Send a player directly to jail (no GO bonus, no walk animation — tagged teleport). */
export function sendToJail(
  state: GameState,
  playerId: string,
  reason: 'card' | 'corner' | 'doubles',
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  const next: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, position: JAIL_POSITION, jailStatus: { attempts: 0 } } : p,
    ),
  };

  return logEvents(next, {
    type: GameEventType.SentToJail, playerId, playerName: player.displayName, reason,
  });
}

// ── Landing resolution ────────────────────────────────────────────────────────

/**
 * Resolve the effect of `playerId` arriving on their current position:
 * rent to another owner, tax, go-to-jail corner. (Card draw on CHANCE/CHEST is
 * handled by the caller, which sets activeCard + DRAWING_CARD.)
 */
export function resolveLanding(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;
  const pos = player.position;
  const space = BOARD[pos];
  if (!space) return state;

  // Go-to-jail corner
  if (space.type === SpaceType.CORNER && space.corner === CornerVariant.GOTO_JAIL) {
    return sendToJail(state, playerId, 'corner');
  }

  // Tax
  if (space.type === SpaceType.TAX) {
    const amount = space.price ?? 0;
    const charged = chargePlayer(state, playerId, amount, null);
    return logEvents(charged, {
      type: GameEventType.TaxPaid,
      playerId, playerName: player.displayName, position: pos, taxName: space.name, amount,
    });
  }

  // Rent on an owned, unmortgaged property/railroad/utility owned by someone else
  const isRentable =
    space.type === SpaceType.PROPERTY ||
    space.type === SpaceType.RAILROAD ||
    space.type === SpaceType.UTILITY;
  if (isRentable) {
    const ownerId = getOwner(state, pos);
    if (ownerId && ownerId !== playerId && !isMortgaged(state, pos)) {
      let rent = getPropertyRent(state, pos);
      if (space.type === SpaceType.UTILITY) {
        const dice = state.turn.diceRoll;
        rent = rent * (dice ? dice.die1 + dice.die2 : 0); // getPropertyRent returns the multiplier
      }
      if (rent > 0) {
        const charged = chargePlayer(state, playerId, rent, ownerId);
        return logEvents(charged, {
          type: GameEventType.RentPaid,
          payerId: playerId, payerName: player.displayName,
          ownerId, ownerName: nameOf(state, ownerId),
          position: pos, propertyName: space.name, amount: rent,
        });
      }
    }
  }

  return state;
}
