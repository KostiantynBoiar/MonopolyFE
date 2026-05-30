/**
 * Mock opponent AI.
 *
 * runOpponentTurn drives ONE opponent turn by issuing the same ClientCommands the
 * viewer uses (processCommand is actor-agnostic since Phase 14), capturing a Snapshot
 * after each step so the page can play the turn out with animation delays.
 *
 * Basic strategy: escape jail cheaply, roll, resolve any card, buy if affordable.
 * Declining-to-auction and debt resolution are intentionally simple here.
 */

import type { GameState, TradeOffer } from '@/shared/protocol/game-state';
import { TurnPhase, TradeStatus } from '@/shared/protocol/game-state';
import type { ServerMessage } from '@/shared/protocol/network';
import { CommandType } from '@/shared/protocol/commands';
import { getOwner, getPlayerProperties } from '@/shared/protocol/selectors';
import { PRICE } from '@/shared/protocol/board-data';
import { processCommand } from './command-processor';
import { makeSnapshot, dispatchToMockServer } from './mock-server';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';

const BUYABLE = new Set<string>([SpaceType.PROPERTY, SpaceType.RAILROAD, SpaceType.UTILITY]);
const CASH_CUSHION = 200;

/** Buy when the purchase still leaves a comfortable cash cushion. */
export function decideBuy(state: GameState, position: number): boolean {
  const space = BOARD[position];
  const price = space && 'price' in space ? space.price ?? 0 : 0;
  const actor = state.players.find((p) => p.id === state.turn.currentPlayerId);
  return !!actor && actor.balance - price > CASH_CUSHION;
}

export function runOpponentTurn(state: GameState): ServerMessage[] {
  const messages: ServerMessage[] = [];
  const id = state.turn.currentPlayerId;
  let s = state;
  const step = (cmd: Parameters<typeof processCommand>[1]) => {
    s = processCommand(s, cmd);
    messages.push(makeSnapshot(s));
  };
  const actorPos = () => s.players.find((p) => p.id === id)?.position ?? -1;
  const jailed   = () => s.players.find((p) => p.id === id)?.jailStatus != null;

  // ── Jail: use a card, else pay the fine, else roll for doubles ───────────
  const start = s.players.find((p) => p.id === id);
  if (start?.jailStatus) {
    if (start.getOutOfJailCards > 0)  step({ type: CommandType.UseJailCard });
    else if (start.balance >= 50)     step({ type: CommandType.PayJailFine });
    else {
      step({ type: CommandType.RollInJail });
      if (jailed()) { step({ type: CommandType.EndTurn }); return messages; } // failed roll, still jailed
    }
  }

  // ── Roll ─────────────────────────────────────────────────────────────────
  if (s.turn.phase === TurnPhase.PRE_ROLL) step({ type: CommandType.RollDice });

  // ── Resolve a drawn card ───────────────────────────────────────────────────
  if (s.turn.phase === TurnPhase.DRAWING_CARD) step({ type: CommandType.ResolveCard });

  // ── Buy the landed-on space if unowned and affordable ──────────────────────
  if (s.turn.phase === TurnPhase.POST_ROLL) {
    const pos = actorPos();
    const space = BOARD[pos];
    if (space && BUYABLE.has(space.type) && getOwner(s, pos) === null && decideBuy(s, pos)) {
      step({ type: CommandType.BuyProperty, position: pos });
    }
  }

  // ── Debt: mortgage spare properties to raise cash, else go bankrupt ────────
  if (s.turn.phase === TurnPhase.MUST_PAY_RENT && s.debt) {
    let guard = 0;
    while (s.debt && (s.players.find((p) => p.id === id)?.balance ?? 0) < s.debt.amount && guard++ < 30) {
      const liquid = getPlayerProperties(s, id).find((p) => !p.isMortgaged && p.houses === 0 && !p.hotel);
      if (!liquid) break;
      step({ type: CommandType.Mortgage, position: liquid.position });
    }
    if (s.debt && (s.players.find((p) => p.id === id)?.balance ?? 0) >= s.debt.amount) {
      step({ type: CommandType.PayDebt });
    } else {
      step({ type: CommandType.DeclareBankruptcy });   // advances the turn itself
      return messages;
    }
  }

  // ── End the turn ───────────────────────────────────────────────────────────
  if (s.turn.phase === TurnPhase.POST_ROLL) {
    step({ type: CommandType.EndTurn });
  }

  return messages;
}

/** Rough cash value of a trade offer (money + property prices + jail cards). */
function offerValue(offer: TradeOffer): number {
  return offer.money
    + offer.positions.reduce((n, pos) => n + (PRICE[pos] ?? 0), 0)
    + offer.getOutOfJailCards * 50;
}

/**
 * An opponent who is the target of a pending trade accepts when the deal favors them
 * (receives ≥ gives), else rejects. Lets the human's proposals actually resolve.
 */
export function opponentRespondToTrade(state: GameState): ServerMessage[] {
  const trade = state.trade;
  if (!trade || trade.status !== TradeStatus.PENDING) return [];

  const receives = offerValue(trade.proposerOffer);  // target receives what proposer offers
  const gives    = offerValue(trade.targetRequest);  // target gives what proposer requests
  const cmd = receives >= gives
    ? { type: CommandType.AcceptTrade as const, tradeId: trade.id }
    : { type: CommandType.RejectTrade as const, tradeId: trade.id };

  return dispatchToMockServer(state, cmd);
}
