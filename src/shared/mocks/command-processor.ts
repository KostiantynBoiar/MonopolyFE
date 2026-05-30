/**
 * Mock command processor.
 * Pure function: (GameState, ClientCommand) → GameState.
 *
 * Only transitions factual state (positions, balances, phases, log).
 * Permissions are computed separately by computePermissions() after every transition.
 */

import type { GameState, ActiveCard, DeckState, GameEvent } from '@/shared/protocol/game-state';
import {
  TurnPhase, CardKind, GameStatus,
  AuctionTargetKind, TradeStatus, GameEventType,
} from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import { getActivePlayers } from '@/shared/protocol/selectors';
import { mortgageValue } from '@/shared/protocol/board-data';
import { appendEvents } from '@/shared/protocol/log';
import { buildCost, sellRefund, unmortgageCost } from '@/shared/lib/property-costs';
import { applyMovement, resolveLanding, sendToJail } from './resolve-landing';
import { drawCard } from './card-decks';
import { resolveCardEffect } from './resolve-card-effect';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Append a typed game event to the log, returning the new log array. */
function log(state: GameState, ...events: GameEvent[]): GameState['log'] {
  return appendEvents(state.log, ...events);
}

function playerName(state: GameState, playerId: string): string {
  return state.players.find((p) => p.id === playerId)?.displayName ?? 'Player';
}

function spaceName(position: number): string {
  return BOARD[position]?.name ?? `#${position}`;
}

function rollDice() {
  const die1 = Math.ceil(Math.random() * 6);
  const die2 = Math.ceil(Math.random() * 6);
  return { die1, die2, isDoubles: die1 === die2, total: die1 + die2 };
}

function advanceTurn(state: GameState): GameState {
  const current = state.players.find((p) => p.id === state.turn.currentPlayerId);

  // Win condition: last solvent player standing.
  const survivors = getActivePlayers(state);
  if (survivors.length === 1) {
    const winner = survivors[0];
    return {
      ...state,
      status:     GameStatus.FINISHED,
      winnerId:   winner.id,
      finishedAt: new Date().toISOString(),
      turn:       { ...state.turn, phase: TurnPhase.GAME_OVER },
      log: log(state, { type: GameEventType.GameOver, winnerId: winner.id, winnerName: winner.displayName }),
    };
  }

  // Doubles grant another roll for the SAME player (unless they were jailed this turn).
  if (state.turn.extraTurn && current && !current.isBankrupt && !current.jailStatus) {
    return {
      ...state,
      turn: {
        ...state.turn,
        phase:         TurnPhase.PRE_ROLL,
        turnNumber:    state.turn.turnNumber + 1,
        diceRoll:      null,
        extraTurn:     false,
      },
      activeCard: null,
    };
  }

  const active = getActivePlayers(state);
  const idx    = active.findIndex((p) => p.id === state.turn.currentPlayerId);
  const next   = active[(idx + 1) % active.length];
  // A wrap back to the first active player completes a round.
  const wrapped = active.length > 0 && (idx + 1) % active.length === 0;

  return {
    ...state,
    turn: {
      ...state.turn,
      phase:           next.jailStatus ? TurnPhase.JAIL_DECISION : TurnPhase.PRE_ROLL,
      currentPlayerId: next.id,
      turnNumber:      state.turn.turnNumber + 1,
      roundNumber:     wrapped ? state.turn.roundNumber + 1 : state.turn.roundNumber,
      diceRoll:        null,
      doublesStreak:   0,
      extraTurn:       false,
    },
    activeCard: null,
    log: log(state, {
      type: GameEventType.TurnStarted, playerId: next.id, playerName: next.displayName,
    }),
  };
}

/** Draw a card if `position` is a Chance/Chest space; returns the card + updated decks. */
function drawForSpace(
  state: GameState,
  position: number,
  drawerId: string,
): { card: ActiveCard; decks: DeckState } | null {
  const spaceType = BOARD[position]?.type;
  if (spaceType === SpaceType.CHANCE) return drawCard(state, CardKind.CHANCE, drawerId);
  if (spaceType === SpaceType.CHEST)  return drawCard(state, CardKind.COMMUNITY_CHEST, drawerId);
  return null;
}

/**
 * Apply an accepted trade: swap money, properties, and jail cards between the
 * proposer and target. proposerOffer flows proposer → target; targetRequest flows
 * target → proposer.
 */
function applyTrade(state: GameState, trade: GameState['trade']): GameState {
  if (!trade) return state;
  const { proposerId, targetId, proposerOffer, targetRequest } = trade;

  const players = state.players.map((p) => {
    if (p.id === proposerId) {
      return {
        ...p,
        balance: p.balance - proposerOffer.money + targetRequest.money,
        getOutOfJailCards: p.getOutOfJailCards - proposerOffer.getOutOfJailCards + targetRequest.getOutOfJailCards,
      };
    }
    if (p.id === targetId) {
      return {
        ...p,
        balance: p.balance - targetRequest.money + proposerOffer.money,
        getOutOfJailCards: p.getOutOfJailCards - targetRequest.getOutOfJailCards + proposerOffer.getOutOfJailCards,
      };
    }
    return p;
  });

  const spaces = state.spaces.map((s) => {
    if (proposerOffer.positions.includes(s.position)) return { ...s, ownerId: targetId };
    if (targetRequest.positions.includes(s.position)) return { ...s, ownerId: proposerId };
    return s;
  });

  return { ...state, players, spaces };
}

// ── Main processor ────────────────────────────────────────────────────────────

export function processCommand(state: GameState, cmd: ClientCommand): GameState {
  // Most commands act as whoever's turn it is — the viewer OR an opponent (Phase 14).
  // Auction bids and trade proposal/response stay viewer/target-driven (see those cases).
  const actorId   = state.turn.currentPlayerId;
  const actorName = playerName(state, actorId);

  switch (cmd.type) {

    case CommandType.RollDice: {
      const actor = state.players.find((p) => p.id === actorId);
      if (!actor) return state;

      const { die1, die2, isDoubles, total } = rollDice();
      const oldPos = actor.position;
      const newPos = (oldPos + total) % 40;
      const newStreak = isDoubles ? state.turn.doublesStreak + 1 : 0;

      // Record dice + streak first so utility rent (resolveLanding) can read the roll.
      let next: GameState = {
        ...state,
        turn: { ...state.turn, diceRoll: { die1, die2, isDoubles }, doublesStreak: newStreak },
        log:  log(state, {
          type: GameEventType.DiceRolled, playerId: actorId, playerName: actor.displayName, die1, die2, isDoubles,
        }),
      };

      // Three doubles in a row → straight to jail, turn ends.
      if (newStreak === 3) {
        next = sendToJail(next, actorId, 'doubles');
        return { ...next, turn: { ...next.turn, phase: TurnPhase.POST_ROLL, extraTurn: false } };
      }

      // Move (single GO-bonus chokepoint).
      const collectGo = newPos < oldPos;
      next = applyMovement(next, actorId, newPos, { collectGo, teleport: false });

      // Chance / Community Chest → draw and pause for the overlay; effect applies on ResolveCard.
      const drawn = drawForSpace(next, newPos, actorId);
      if (drawn) {
        return {
          ...next,
          activeCard: drawn.card,
          decks:      drawn.decks,
          turn:       { ...next.turn, phase: TurnPhase.DRAWING_CARD, extraTurn: isDoubles },
          log:        log({ ...next, activeCard: drawn.card }, {
            type: GameEventType.CardDrawn,
            playerId: actorId, playerName: actor.displayName,
            cardKind: drawn.card.kind, text: drawn.card.text,
          }),
        };
      }

      // Rent / tax / go-to-jail corner.
      next = resolveLanding(next, actorId);

      const jailed   = next.players.find((p) => p.id === actorId)?.jailStatus != null;
      const inDebt   = next.turn.phase === TurnPhase.MUST_PAY_RENT;
      const phase    = inDebt ? TurnPhase.MUST_PAY_RENT : TurnPhase.POST_ROLL;
      return { ...next, turn: { ...next.turn, phase, extraTurn: isDoubles && !jailed && !inDebt } };
    }

    case CommandType.EndTurn:
      return advanceTurn(state);

    case CommandType.BuyProperty: {
      const space = BOARD[cmd.position];
      const price = (space && 'price' in space) ? (space.price ?? 0) : 0;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance - price } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, ownerId: actorId } : s,
        ),
        log: log(state, {
          type: GameEventType.PropertyBought, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), price,
        }),
      };
    }

    case CommandType.BuildHouse: {
      const space = BOARD[cmd.position];
      const cost  = (space && 'price' in space) ? buildCost(space.price ?? 0) : 50;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance - cost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && !s.hotel && s.houses < 4
            ? { ...s, houses: (s.houses + 1) as 0 | 1 | 2 | 3 | 4 }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HouseBuilt, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), cost,
        }),
      };
    }

    case CommandType.BuildHotel: {
      const space = BOARD[cmd.position];
      const cost  = (space && 'price' in space) ? buildCost(space.price ?? 0) : 50;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance - cost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && s.houses === 4
            ? { ...s, houses: 0 as const, hotel: true }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HotelBuilt, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), cost,
        }),
      };
    }

    case CommandType.SellHouse: {
      const space  = BOARD[cmd.position];
      const refund = (space && 'price' in space) ? sellRefund(space.price ?? 0) : 25;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance + refund } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && s.houses > 0
            ? { ...s, houses: (s.houses - 1) as 0 | 1 | 2 | 3 | 4 }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HouseSold, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), refund,
        }),
      };
    }

    case CommandType.SellHotel: {
      const space  = BOARD[cmd.position];
      const refund = (space && 'price' in space) ? sellRefund(space.price ?? 0) : 50;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance + refund } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && s.hotel
            ? { ...s, hotel: false, houses: 4 as const }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HotelSold, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), refund,
        }),
      };
    }

    case CommandType.Mortgage: {
      const value = mortgageValue(cmd.position);
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance + value } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, isMortgaged: true } : s,
        ),
        log: log(state, {
          type: GameEventType.Mortgaged, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), amount: value,
        }),
      };
    }

    case CommandType.Unmortgage: {
      const space          = BOARD[cmd.position];
      const cost           = (space && 'price' in space) ? unmortgageCost(space.price ?? 0) : 0;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance - cost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, isMortgaged: false } : s,
        ),
        log: log(state, {
          type: GameEventType.Unmortgaged, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), cost,
        }),
      };
    }

    case CommandType.StartTrade:
      return {
        ...state,
        trade: {
          id:            `trade_${Date.now()}`,
          proposerId:    actorId,
          targetId:      cmd.targetId,
          proposerOffer: cmd.offer,
          targetRequest: cmd.request,
          status:        TradeStatus.PENDING,
          expiresAt:     new Date(Date.now() + 120_000).toISOString(),
        },
        turn: { ...state.turn, phase: TurnPhase.TRADE_NEGOTIATION },
      };

    case CommandType.AcceptTrade: {
      if (!state.trade) return state;
      // Actually move the assets, then mark the trade accepted.
      const settled = applyTrade(state, state.trade);
      return {
        ...settled,
        trade: { ...state.trade, status: TradeStatus.ACCEPTED },
        turn:  { ...settled.turn, phase: TurnPhase.POST_ROLL },
        log:   log(settled, { type: GameEventType.TradeResolved, tradeId: state.trade.id, accepted: true }),
      };
    }

    case CommandType.RejectTrade:
      return {
        ...state,
        trade: state.trade ? { ...state.trade, status: TradeStatus.REJECTED } : null,
        turn:  { ...state.turn, phase: TurnPhase.POST_ROLL },
        log:   log(state, { type: GameEventType.TradeResolved, tradeId: state.trade?.id ?? '', accepted: false }),
      };

    case CommandType.CounterTrade: {
      if (!state.trade) return state;
      // The counter-er (current target) becomes the new proposer; roles swap.
      return {
        ...state,
        trade: {
          ...state.trade,
          proposerId:    state.trade.targetId,
          targetId:      state.trade.proposerId,
          proposerOffer: cmd.offer,
          targetRequest: cmd.request,
          status:        TradeStatus.COUNTERED,
        },
      };
    }

    case CommandType.SellProperty: {
      const refund = mortgageValue(cmd.position);   // bank buys back at the mortgage value
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance + refund } : p,
        ),
        spaces: state.spaces.map((s) =>
          s.position === cmd.position ? { ...s, ownerId: null, houses: 0 as const, hotel: false, isMortgaged: false } : s,
        ),
        log: log(state, {
          type: GameEventType.PropertySold, playerId: actorId, playerName: actorName,
          position: cmd.position, propertyName: spaceName(cmd.position), refund,
        }),
      };
    }

    case CommandType.PayDebt: {
      const debt = state.debt;
      if (!debt) return state;
      const debtor = state.players.find((p) => p.id === debt.debtorId);
      if (!debtor || debtor.balance < debt.amount) return state;  // raise cash first

      const players = state.players.map((p) => {
        if (p.id === debt.debtorId)                     return { ...p, balance: p.balance - debt.amount };
        if (debt.creditorId && p.id === debt.creditorId) return { ...p, balance: p.balance + debt.amount };
        return p;
      });
      return {
        ...state,
        players,
        debt: null,
        turn: { ...state.turn, phase: TurnPhase.POST_ROLL },   // resume the debtor's turn
      };
    }

    case CommandType.DeclareBankruptcy: {
      const debt = state.debt;
      const debtorId   = debt?.debtorId ?? actorId;
      const creditorId = debt?.creditorId ?? null;
      const debtor = state.players.find((p) => p.id === debtorId);
      if (!debtor) return state;

      const players = state.players.map((p) => {
        if (p.id === debtorId) {
          return { ...p, isBankrupt: true, balance: 0, getOutOfJailCards: 0, jailStatus: null };
        }
        // Creditor inherits the bankrupt player's remaining cash.
        if (creditorId && p.id === creditorId) {
          return { ...p, balance: p.balance + debtor.balance, getOutOfJailCards: p.getOutOfJailCards + debtor.getOutOfJailCards };
        }
        return p;
      });

      // Properties pass to the creditor (player) or back to the bank; buildings cleared.
      const spaces = state.spaces.map((s) =>
        s.ownerId === debtorId
          ? { ...s, ownerId: creditorId, houses: 0 as const, hotel: false }
          : s,
      );

      const bankrupted: GameState = {
        ...state,
        players,
        spaces,
        debt: null,
        log: log(state, { type: GameEventType.Bankrupted, playerId: debtorId, playerName: debtor.displayName, creditorId }),
      };
      // Advance the turn (also runs the win-condition check).
      return advanceTurn(bankrupted);
    }

    case CommandType.BidAuction: {
      // The human (viewer) is the bidder — even during an auction triggered by an
      // opponent's decline, where currentPlayerId is the opponent. Opponents bid via
      // the mock-server auction tick, not this command.
      if (!state.auction || cmd.amount <= state.auction.highestBid) return state;
      const bidderId = state.viewerId;
      return {
        ...state,
        auction: {
          ...state.auction,
          bids:            [...state.auction.bids, { playerId: bidderId, amount: cmd.amount }],
          highestBid:      cmd.amount,
          highestBidderId: bidderId,
        },
        log: log(state, {
          type: GameEventType.AuctionBid, playerId: bidderId, playerName: playerName(state, bidderId), amount: cmd.amount,
        }),
      };
    }

    case CommandType.PayJailFine:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId ? { ...p, balance: p.balance - 50, jailStatus: null } : p,
        ),
        turn: { ...state.turn, phase: TurnPhase.PRE_ROLL },
        log:  log(state, {
          type: GameEventType.LeftJail, playerId: actorId, playerName: actorName, method: 'fine',
        }),
      };

    case CommandType.UseJailCard:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === actorId
            ? { ...p, getOutOfJailCards: p.getOutOfJailCards - 1, jailStatus: null }
            : p,
        ),
        turn: { ...state.turn, phase: TurnPhase.PRE_ROLL },
        log:  log(state, {
          type: GameEventType.LeftJail, playerId: actorId, playerName: actorName, method: 'card',
        }),
      };

    case CommandType.RollInJail: {
      const actor = state.players.find((p) => p.id === actorId);
      if (!actor || !actor.jailStatus) return state;

      const { die1, die2, isDoubles, total } = rollDice();
      const attempt = actor.jailStatus.attempts + 1;

      let next: GameState = {
        ...state,
        turn: { ...state.turn, diceRoll: { die1, die2, isDoubles } },
        log:  log(state, {
          type: GameEventType.DiceRolled, playerId: actorId, playerName: actor.displayName, die1, die2, isDoubles,
        }),
      };

      // Doubles → free; or the 3rd failed attempt → forced to pay M50, then move.
      if (isDoubles || attempt >= 3) {
        const method = isDoubles ? 'doubles' : 'fine';
        next = {
          ...next,
          players: next.players.map((p) =>
            p.id === actorId
              ? { ...p, jailStatus: null, balance: method === 'fine' ? p.balance - 50 : p.balance }
              : p,
          ),
        };
        next = { ...next, log: log(next, {
          type: GameEventType.LeftJail, playerId: actorId, playerName: actor.displayName, method,
        }) };
        next = applyMovement(next, actorId, (actor.position + total) % 40, { collectGo: false, teleport: false });
        next = resolveLanding(next, actorId);
        const inDebt = next.turn.phase === TurnPhase.MUST_PAY_RENT;
        return { ...next, turn: { ...next.turn, phase: inDebt ? TurnPhase.MUST_PAY_RENT : TurnPhase.POST_ROLL } };
      }

      // Failed attempt — stay jailed, turn ends.
      return {
        ...next,
        players: next.players.map((p) =>
          p.id === actorId ? { ...p, jailStatus: { attempts: attempt } } : p,
        ),
        turn: { ...next.turn, phase: TurnPhase.POST_ROLL },
      };
    }

    case CommandType.ResolveCard: {
      const card = state.activeCard;
      if (!card) return state;

      let next = resolveCardEffect(state, card.effect, card.drawerId);
      next = { ...next, activeCard: null };
      next = { ...next, log: log(next, {
        type: GameEventType.CardResolved,
        playerId: card.drawerId, playerName: playerName(next, card.drawerId), text: card.text,
      }) };

      // A card may have moved the player into debt (keep MUST_PAY_RENT) or to jail
      // (POST_ROLL ends the turn; next turn routes to JAIL_DECISION). Otherwise resume.
      const phase = next.turn.phase === TurnPhase.MUST_PAY_RENT
        ? TurnPhase.MUST_PAY_RENT
        : TurnPhase.POST_ROLL;
      return { ...next, turn: { ...next.turn, phase } };
    }

    default:
      return state;
  }
}
