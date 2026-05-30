/**
 * Mock command processor.
 * Pure function: (GameState, ClientCommand) → GameState.
 *
 * Only transitions factual state (positions, balances, phases, log).
 * Permissions are computed separately by computePermissions() after every transition.
 */

import type { GameState, ActiveCard, GameEvent } from '@/shared/protocol/game-state';
import {
  TurnPhase, CardKind, CardEffectType,
  AuctionTargetKind, TradeStatus, GameEventType,
} from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import { getActivePlayers } from '@/shared/protocol/selectors';
import { appendEvents } from '@/shared/protocol/log';
import { applyMovement, resolveLanding, sendToJail } from './resolve-landing';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Append a typed game event to the log, returning the new log array. */
function log(state: GameState, ...events: GameEvent[]): GameState['log'] {
  return appendEvents(state.log, ...events);
}

function viewerName(state: GameState): string {
  return playerName(state, state.viewerId);
}

function playerName(state: GameState, playerId: string): string {
  return state.players.find((p) => p.id === playerId)?.displayName ?? 'Player';
}

function spaceName(position: number): string {
  return BOARD[position]?.name ?? `#${position}`;
}

function advanceTurn(state: GameState): GameState {
  const current = state.players.find((p) => p.id === state.turn.currentPlayerId);

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

function mockCard(state: GameState, position: number): ActiveCard | null {
  const spaceType = BOARD[position]?.type;
  if (spaceType === SpaceType.CHANCE) {
    return {
      id:       `card_chance_${Date.now()}`,
      kind:     CardKind.CHANCE,
      text:     'Advance to GO. Collect M200.',
      effect:   { type: CardEffectType.ADVANCE_TO, position: 0, collectGoBonus: true },
      drawerId: state.viewerId,
    };
  }
  if (spaceType === SpaceType.CHEST) {
    return {
      id:       `card_chest_${Date.now()}`,
      kind:     CardKind.COMMUNITY_CHEST,
      text:     'Bank error in your favor. Collect M200.',
      effect:   { type: CardEffectType.COLLECT, amount: 200 },
      drawerId: state.viewerId,
    };
  }
  return null;
}

// ── Main processor ────────────────────────────────────────────────────────────

export function processCommand(state: GameState, cmd: ClientCommand): GameState {
  switch (cmd.type) {

    case CommandType.RollDice: {
      // Roll for whoever's turn it is (viewer or opponent — Phase 14 drives opponents).
      const actorId = state.turn.currentPlayerId;
      const actor   = state.players.find((p) => p.id === actorId);
      if (!actor) return state;

      const die1 = Math.ceil(Math.random() * 6);
      const die2 = Math.ceil(Math.random() * 6);
      const isDoubles = die1 === die2;
      const total  = die1 + die2;
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

      // Chance / Community Chest → draw and pause for the overlay (effects in Phase 13).
      const drawnCard = mockCard(next, newPos);
      if (drawnCard) {
        return {
          ...next,
          activeCard: drawnCard,
          turn: { ...next.turn, phase: TurnPhase.DRAWING_CARD, extraTurn: isDoubles },
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
          p.id === state.viewerId ? { ...p, balance: p.balance - price } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, ownerId: state.viewerId } : s,
        ),
        log: log(state, {
          type: GameEventType.PropertyBought, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), price,
        }),
      };
    }

    case CommandType.BuildHouse: {
      const space = BOARD[cmd.position];
      const cost  = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 2) : 50;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance - cost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && !s.hotel && s.houses < 4
            ? { ...s, houses: (s.houses + 1) as 0 | 1 | 2 | 3 | 4 }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HouseBuilt, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), cost,
        }),
      };
    }

    case CommandType.BuildHotel: {
      const space = BOARD[cmd.position];
      const cost  = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 2) : 50;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance - cost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && s.houses === 4
            ? { ...s, houses: 0 as const, hotel: true }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HotelBuilt, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), cost,
        }),
      };
    }

    case CommandType.SellHouse: {
      const space  = BOARD[cmd.position];
      const refund = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 4) : 25;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance + refund } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && s.houses > 0
            ? { ...s, houses: (s.houses - 1) as 0 | 1 | 2 | 3 | 4 }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HouseSold, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), refund,
        }),
      };
    }

    case CommandType.SellHotel: {
      const space  = BOARD[cmd.position];
      const refund = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 4) : 50;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance + refund } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position && s.hotel
            ? { ...s, hotel: false, houses: 4 as const }
            : s,
        ),
        log: log(state, {
          type: GameEventType.HotelSold, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), refund,
        }),
      };
    }

    case CommandType.Mortgage: {
      const space         = BOARD[cmd.position];
      const mortgageValue = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 2) : 0;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance + mortgageValue } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, isMortgaged: true } : s,
        ),
        log: log(state, {
          type: GameEventType.Mortgaged, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), amount: mortgageValue,
        }),
      };
    }

    case CommandType.Unmortgage: {
      const space          = BOARD[cmd.position];
      const unmortgageCost = (space && 'price' in space) ? Math.ceil((space.price ?? 0) * 0.55) : 0;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance - unmortgageCost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, isMortgaged: false } : s,
        ),
        log: log(state, {
          type: GameEventType.Unmortgaged, playerId: state.viewerId, playerName: viewerName(state),
          position: cmd.position, propertyName: spaceName(cmd.position), cost: unmortgageCost,
        }),
      };
    }

    case CommandType.StartTrade:
      return {
        ...state,
        trade: {
          id:            `trade_${Date.now()}`,
          proposerId:    state.viewerId,
          targetId:      cmd.targetId,
          proposerOffer: cmd.offer,
          targetRequest: cmd.request,
          status:        TradeStatus.PENDING,
          expiresAt:     new Date(Date.now() + 120_000).toISOString(),
        },
        turn: { ...state.turn, phase: TurnPhase.TRADE_NEGOTIATION },
      };

    case CommandType.AcceptTrade:
      return {
        ...state,
        trade: state.trade ? { ...state.trade, status: TradeStatus.ACCEPTED } : null,
        turn:  { ...state.turn, phase: TurnPhase.POST_ROLL },
        log:   log(state, { type: GameEventType.TradeResolved, tradeId: state.trade?.id ?? '', accepted: true }),
      };

    case CommandType.RejectTrade:
      return {
        ...state,
        trade: state.trade ? { ...state.trade, status: TradeStatus.REJECTED } : null,
        turn:  { ...state.turn, phase: TurnPhase.POST_ROLL },
        log:   log(state, { type: GameEventType.TradeResolved, tradeId: state.trade?.id ?? '', accepted: false }),
      };

    case CommandType.BidAuction: {
      if (!state.auction || cmd.amount <= state.auction.highestBid) return state;
      return {
        ...state,
        auction: {
          ...state.auction,
          bids:            [...state.auction.bids, { playerId: state.viewerId, amount: cmd.amount }],
          highestBid:      cmd.amount,
          highestBidderId: state.viewerId,
        },
        log: log(state, {
          type: GameEventType.AuctionBid, playerId: state.viewerId, playerName: viewerName(state), amount: cmd.amount,
        }),
      };
    }

    case CommandType.PayJailFine:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance - 50, jailStatus: null } : p,
        ),
        turn: { ...state.turn, phase: TurnPhase.PRE_ROLL },
        log:  log(state, {
          type: GameEventType.LeftJail, playerId: state.viewerId, playerName: viewerName(state), method: 'fine',
        }),
      };

    case CommandType.UseJailCard:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId
            ? { ...p, getOutOfJailCards: p.getOutOfJailCards - 1, jailStatus: null }
            : p,
        ),
        turn: { ...state.turn, phase: TurnPhase.PRE_ROLL },
        log:  log(state, {
          type: GameEventType.LeftJail, playerId: state.viewerId, playerName: viewerName(state), method: 'card',
        }),
      };

    default:
      return state;
  }
}
