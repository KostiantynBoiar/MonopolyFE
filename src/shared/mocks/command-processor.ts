/**
 * Mock command processor.
 * Pure function: (GameState, ClientCommand) → GameState.
 * Runs entirely client-side in mock/dev mode.
 * When the real backend is wired, this file is unused — the server emits state updates over WS.
 */

import type { GameState, ActiveCard } from '@/shared/protocol/game-state';
import {
  TurnPhase, LogKind, CardKind, CardEffectType,
  AuctionTargetKind, TradeStatus, DebtCreditorType,
} from '@/shared/protocol/game-state';
import type { ClientCommand } from '@/shared/protocol/commands';
import { CommandType } from '@/shared/protocol/commands';
import { getActivePlayers } from '@/shared/protocol/selectors';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(state: GameState, text: string): GameState['log'] {
  return [...state.log, { id: `log_${Date.now()}`, kind: LogKind.EVENT, text, ts: new Date().toISOString() }];
}

function viewerName(state: GameState): string {
  return state.players.find((p) => p.id === state.viewerId)?.displayName ?? 'Player';
}

/** Advance to the next non-bankrupt player. */
function advanceTurn(state: GameState): GameState {
  const active = getActivePlayers(state);
  const idx = active.findIndex((p) => p.id === state.turn.currentPlayerId);
  const next = active[(idx + 1) % active.length];
  const isViewer = next.id === state.viewerId;

  return {
    ...state,
    turn: {
      ...state.turn,
      phase:           next.jailStatus ? TurnPhase.JAIL_DECISION : TurnPhase.PRE_ROLL,
      currentPlayerId: next.id,
      turnNumber:      state.turn.turnNumber + 1,
      diceRoll:        null,
      doublesStreak:   0,
      actionsAvailable: {
        canRoll:        isViewer,
        canBuy:         false,
        canBuild:       false,
        canSellBuildings: false,
        canMortgage:    isViewer,
        canUnmortgage:  isViewer,
        canTrade:       isViewer,
        canEndTurn:     false,
        canPayJailFine: isViewer && next.jailStatus !== null,
        canUseJailCard: isViewer && next.getOutOfJailCards > 0,
        canBid:         false,
      },
    },
    activeCard: null,
    log: log(state, `${next.displayName}'s turn.`),
  };
}

/** Produce a mock card for Chance/Community Chest spaces. */
function mockCard(state: GameState, position: number): ActiveCard | null {
  const spaceType = BOARD[position]?.type;
  if (spaceType === SpaceType.CHANCE) {
    return {
      id: `card_chance_${Date.now()}`,
      kind: CardKind.CHANCE,
      text: 'Advance to GO. Collect M200.',
      effect: { type: CardEffectType.ADVANCE_TO, position: 0, collectGoBonus: true },
      drawerId: state.viewerId,
    };
  }
  if (spaceType === SpaceType.CHEST) {
    return {
      id: `card_chest_${Date.now()}`,
      kind: CardKind.COMMUNITY_CHEST,
      text: 'Bank error in your favor. Collect M200.',
      effect: { type: CardEffectType.COLLECT, amount: 200 },
      drawerId: state.viewerId,
    };
  }
  return null;
}

// ── Main processor ────────────────────────────────────────────────────────────

export function processCommand(state: GameState, cmd: ClientCommand): GameState {
  switch (cmd.type) {

    // ── Roll dice ─────────────────────────────────────────────────────────────
    case CommandType.RollDice: {
      const die1 = Math.ceil(Math.random() * 6);
      const die2 = Math.ceil(Math.random() * 6);
      const isDoubles = die1 === die2;
      const total = die1 + die2;
      const viewer = state.players.find((p) => p.id === state.viewerId)!;
      const newPos = (viewer.position + total) % 40;
      const drawnCard = mockCard(state, newPos);

      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, position: newPos } : p,
        ),
        activeCard: drawnCard,
        turn: {
          ...state.turn,
          diceRoll:      { die1, die2, isDoubles },
          phase:         drawnCard ? TurnPhase.DRAWING_CARD : TurnPhase.POST_ROLL,
          doublesStreak: isDoubles ? state.turn.doublesStreak + 1 : 0,
          actionsAvailable: {
            ...state.turn.actionsAvailable,
            canRoll:    false,
            canEndTurn: false,
          },
        },
        log: log(
          state,
          `${viewer.displayName} rolled ${die1} + ${die2} = ${total}${isDoubles ? ' (doubles!)' : ''}. ` +
          `Moved to ${BOARD[newPos]?.name ?? `space ${newPos}`}.`,
        ),
      };
    }

    // ── End turn ──────────────────────────────────────────────────────────────
    case CommandType.EndTurn:
      return advanceTurn(state);

    // ── Buy property ──────────────────────────────────────────────────────────
    case CommandType.BuyProperty: {
      const space = BOARD[cmd.position];
      const price = (space && 'price' in space) ? (space.price ?? 0) : 0;
      const name  = space?.name ?? `#${cmd.position}`;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance - price } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, ownerId: state.viewerId } : s,
        ),
        log: log(state, `${viewerName(state)} bought ${name} for M${price}.`),
      };
    }

    // ── Build house ───────────────────────────────────────────────────────────
    case CommandType.BuildHouse: {
      const space = BOARD[cmd.position];
      const cost = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 2) : 50;
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
        log: log(state, `${viewerName(state)} built a house on ${BOARD[cmd.position]?.name ?? `#${cmd.position}`} (M${cost}).`),
      };
    }

    // ── Build hotel ───────────────────────────────────────────────────────────
    case CommandType.BuildHotel: {
      const space = BOARD[cmd.position];
      const cost = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 2) : 50;
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
        log: log(state, `${viewerName(state)} upgraded ${BOARD[cmd.position]?.name ?? `#${cmd.position}`} to a hotel (M${cost}).`),
      };
    }

    // ── Sell house ────────────────────────────────────────────────────────────
    case CommandType.SellHouse: {
      const space = BOARD[cmd.position];
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
        log: log(state, `${viewerName(state)} sold a house on ${BOARD[cmd.position]?.name ?? `#${cmd.position}`} for M${refund}.`),
      };
    }

    // ── Sell hotel ────────────────────────────────────────────────────────────
    case CommandType.SellHotel: {
      const space = BOARD[cmd.position];
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
        log: log(state, `${viewerName(state)} sold hotel on ${BOARD[cmd.position]?.name ?? `#${cmd.position}`} for M${refund}.`),
      };
    }

    // ── Mortgage ──────────────────────────────────────────────────────────────
    case CommandType.Mortgage: {
      const space = BOARD[cmd.position];
      const mortgageValue = (space && 'price' in space) ? Math.floor((space.price ?? 0) / 2) : 0;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance + mortgageValue } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, isMortgaged: true } : s,
        ),
        log: log(state, `${viewerName(state)} mortgaged ${BOARD[cmd.position]?.name ?? `#${cmd.position}`} for M${mortgageValue}.`),
      };
    }

    // ── Unmortgage ────────────────────────────────────────────────────────────
    case CommandType.Unmortgage: {
      const space = BOARD[cmd.position];
      const unmortgageCost = (space && 'price' in space) ? Math.ceil((space.price ?? 0) * 0.55) : 0;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId ? { ...p, balance: p.balance - unmortgageCost } : p,
        ),
        spaces: state.spaces.map((s, i) =>
          i === cmd.position ? { ...s, isMortgaged: false } : s,
        ),
        log: log(state, `${viewerName(state)} unmortgaged ${BOARD[cmd.position]?.name ?? `#${cmd.position}`} for M${unmortgageCost}.`),
      };
    }

    // ── Start trade ───────────────────────────────────────────────────────────
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

    // ── Accept trade ──────────────────────────────────────────────────────────
    case CommandType.AcceptTrade:
      return {
        ...state,
        trade:  state.trade ? { ...state.trade, status: TradeStatus.ACCEPTED } : null,
        turn:   { ...state.turn, phase: TurnPhase.POST_ROLL },
        log:    log(state, 'Trade accepted.'),
      };

    // ── Reject trade ──────────────────────────────────────────────────────────
    case CommandType.RejectTrade:
      return {
        ...state,
        trade:  state.trade ? { ...state.trade, status: TradeStatus.REJECTED } : null,
        turn:   { ...state.turn, phase: TurnPhase.POST_ROLL },
        log:    log(state, 'Trade rejected.'),
      };

    // ── Bid auction ───────────────────────────────────────────────────────────
    case CommandType.BidAuction: {
      if (!state.auction || cmd.amount <= state.auction.highestBid) return state;
      return {
        ...state,
        auction: {
          ...state.auction,
          bids:             [...state.auction.bids, { playerId: state.viewerId, amount: cmd.amount }],
          highestBid:       cmd.amount,
          highestBidderId:  state.viewerId,
        },
        log: log(state, `${viewerName(state)} bids M${cmd.amount}.`),
      };
    }

    // ── Pay jail fine ─────────────────────────────────────────────────────────
    case CommandType.PayJailFine:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId
            ? { ...p, balance: p.balance - 50, jailStatus: null }
            : p,
        ),
        turn: {
          ...state.turn,
          phase: TurnPhase.PRE_ROLL,
          actionsAvailable: {
            ...state.turn.actionsAvailable,
            canRoll: true, canPayJailFine: false, canUseJailCard: false,
          },
        },
        log: log(state, `${viewerName(state)} paid M50 to get out of jail.`),
      };

    // ── Use jail card ─────────────────────────────────────────────────────────
    case CommandType.UseJailCard:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === state.viewerId
            ? { ...p, getOutOfJailCards: p.getOutOfJailCards - 1, jailStatus: null }
            : p,
        ),
        turn: {
          ...state.turn,
          phase: TurnPhase.PRE_ROLL,
          actionsAvailable: {
            ...state.turn.actionsAvailable,
            canRoll: true, canPayJailFine: false, canUseJailCard: false,
          },
        },
        log: log(state, `${viewerName(state)} used a Get Out of Jail Free card.`),
      };

    default:
      return state;
  }
}
