/**
 * Pure card-effect resolver: (GameState, CardEffect, drawerId) → GameState.
 *
 * Composes the Phase 11 engine: movement effects call applyMovement + resolveLanding
 * (so advancing onto an owned property pays rent), money effects use chargePlayer /
 * addBalance, and go-to-jail reuses sendToJail. The frontend never calls this — only
 * the mock backend (via the ResolveCard command).
 */

import type { GameState, CardEffect } from '@/shared/protocol/game-state';
import { CardEffectType, AdvanceToNearestSpaceType, GameEventType } from '@/shared/protocol/game-state';
import { getOwner, isMortgaged, getPropertyRent, getPlayerProperties, getActivePlayers } from '@/shared/protocol/selectors';
import {
  applyMovement, resolveLanding, sendToJail, chargePlayer, addBalance, logEvents, nameOf,
} from './resolve-landing';
import { BOARD } from '@/shared/config/board-layout';

const RAILROADS = [5, 15, 25, 35];
const UTILITIES = [12, 28];

/** Nearest position in `targets` at or ahead of `from`, wrapping clockwise. */
function nearestAhead(from: number, targets: number[]): number {
  const ahead = targets.filter((t) => t > from);
  return ahead.length > 0 ? Math.min(...ahead) : Math.min(...targets);
}

export function resolveCardEffect(state: GameState, effect: CardEffect, drawerId: string): GameState {
  const drawer = state.players.find((p) => p.id === drawerId);
  if (!drawer) return state;
  const name = drawer.displayName;

  switch (effect.type) {
    case CardEffectType.ADVANCE_TO: {
      const collectGo = effect.collectGoBonus && effect.position < drawer.position;
      const moved = applyMovement(state, drawerId, effect.position, { collectGo, teleport: true });
      return resolveLanding(moved, drawerId);
    }

    case CardEffectType.GO_BACK: {
      const target = (drawer.position - effect.spaces + 40) % 40;
      // Going back never collects GO.
      const moved = applyMovement(state, drawerId, target, { collectGo: false, teleport: true });
      return resolveLanding(moved, drawerId);
    }

    case CardEffectType.GO_TO_JAIL:
      return sendToJail(state, drawerId, 'card');

    case CardEffectType.ADVANCE_TO_NEAREST: {
      const targets = effect.spaceType === AdvanceToNearestSpaceType.RAILROAD ? RAILROADS : UTILITIES;
      const target  = nearestAhead(drawer.position, targets);
      const collectGo = target < drawer.position;
      let next = applyMovement(state, drawerId, target, { collectGo, teleport: true });

      const ownerId = getOwner(next, target);
      if (ownerId && ownerId !== drawerId && !isMortgaged(next, target)) {
        let rent: number;
        if (effect.spaceType === AdvanceToNearestSpaceType.RAILROAD) {
          rent = getPropertyRent(next, target) * (effect.payDouble ? 2 : 1);
        } else {
          const dice = next.turn.diceRoll;
          rent = 10 * (dice ? dice.die1 + dice.die2 : 0); // card rule: 10× dice regardless of count
        }
        if (rent > 0) {
          next = chargePlayer(next, drawerId, rent, ownerId);
          next = logEvents(next, {
            type: GameEventType.RentPaid,
            payerId: drawerId, payerName: name,
            ownerId, ownerName: nameOf(next, ownerId),
            position: target, propertyName: BOARD[target]?.name ?? `#${target}`, amount: rent,
          });
        }
      }
      return next;
    }

    case CardEffectType.COLLECT:
      return addBalance(state, drawerId, effect.amount);

    case CardEffectType.PAY:
      return chargePlayer(state, drawerId, effect.amount, null);

    case CardEffectType.COLLECT_FROM_EACH_PLAYER: {
      let next = state;
      for (const other of getActivePlayers(state)) {
        if (other.id === drawerId) continue;
        next = chargePlayer(next, other.id, effect.amount, drawerId);
      }
      return next;
    }

    case CardEffectType.PAY_EACH_PLAYER: {
      let next = state;
      for (const other of getActivePlayers(state)) {
        if (other.id === drawerId) continue;
        next = chargePlayer(next, drawerId, effect.amount, other.id);
      }
      return next;
    }

    case CardEffectType.GET_OUT_OF_JAIL_FREE:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === drawerId ? { ...p, getOutOfJailCards: p.getOutOfJailCards + 1 } : p,
        ),
      };

    case CardEffectType.REPAIRS: {
      const owned = getPlayerProperties(state, drawerId);
      const houses = owned.reduce((n, s) => n + (s.hotel ? 0 : s.houses), 0);
      const hotels = owned.reduce((n, s) => n + (s.hotel ? 1 : 0), 0);
      const cost = houses * effect.perHouse + hotels * effect.perHotel;
      return cost > 0 ? chargePlayer(state, drawerId, cost, null) : state;
    }
  }
}
