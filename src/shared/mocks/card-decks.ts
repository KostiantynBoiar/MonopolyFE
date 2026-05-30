/**
 * Mock Chance & Community Chest decks.
 *
 * Card templates are keyed by id; DeckState (in GameState) holds only the id
 * order so the deck is serializable. drawCard pops the next id, reshuffling the
 * discard pile back in when the draw pile empties (and self-seeding from all
 * templates when both are empty, so an empty seed Just Works).
 */

import type { ActiveCard, CardEffect, DeckState, GameState } from '@/shared/protocol/game-state';
import { CardKind, CardEffectType, AdvanceToNearestSpaceType } from '@/shared/protocol/game-state';

type CardTemplate = { id: string; text: string; effect: CardEffect };

const CHANCE: CardTemplate[] = [
  { id: 'ch_advance_go',    text: 'Advance to GO. Collect M200.',          effect: { type: CardEffectType.ADVANCE_TO, position: 0,  collectGoBonus: true } },
  { id: 'ch_boardwalk',     text: 'Advance to Boardwalk.',                 effect: { type: CardEffectType.ADVANCE_TO, position: 39, collectGoBonus: true } },
  { id: 'ch_nearest_rail',  text: 'Advance to the nearest Railroad. Pay double rent.', effect: { type: CardEffectType.ADVANCE_TO_NEAREST, spaceType: AdvanceToNearestSpaceType.RAILROAD, payDouble: true } },
  { id: 'ch_nearest_util',  text: 'Advance to the nearest Utility.',       effect: { type: CardEffectType.ADVANCE_TO_NEAREST, spaceType: AdvanceToNearestSpaceType.UTILITY, payDouble: false } },
  { id: 'ch_goto_jail',     text: 'Go directly to Jail. Do not pass GO.',  effect: { type: CardEffectType.GO_TO_JAIL } },
  { id: 'ch_back_3',        text: 'Go back 3 spaces.',                      effect: { type: CardEffectType.GO_BACK, spaces: 3 } },
  { id: 'ch_dividend',      text: 'Bank pays you a dividend of M50.',       effect: { type: CardEffectType.COLLECT, amount: 50 } },
  { id: 'ch_poor_tax',      text: 'Pay poor tax of M15.',                   effect: { type: CardEffectType.PAY, amount: 15 } },
  { id: 'ch_chairman',      text: 'Elected Chairman. Pay each player M50.', effect: { type: CardEffectType.PAY_EACH_PLAYER, amount: 50 } },
  { id: 'ch_jail_free',     text: 'Get Out of Jail Free.',                  effect: { type: CardEffectType.GET_OUT_OF_JAIL_FREE } },
  { id: 'ch_repairs',       text: 'Make general repairs: M25 per house, M100 per hotel.', effect: { type: CardEffectType.REPAIRS, perHouse: 25, perHotel: 100 } },
];

const COMMUNITY_CHEST: CardTemplate[] = [
  { id: 'cc_advance_go',    text: 'Advance to GO. Collect M200.',          effect: { type: CardEffectType.ADVANCE_TO, position: 0, collectGoBonus: true } },
  { id: 'cc_bank_error',    text: 'Bank error in your favor. Collect M200.', effect: { type: CardEffectType.COLLECT, amount: 200 } },
  { id: 'cc_doctor',        text: "Doctor's fee. Pay M50.",                 effect: { type: CardEffectType.PAY, amount: 50 } },
  { id: 'cc_goto_jail',     text: 'Go directly to Jail. Do not pass GO.',  effect: { type: CardEffectType.GO_TO_JAIL } },
  { id: 'cc_opera',         text: 'Grand Opera Night. Collect M50 from every player.', effect: { type: CardEffectType.COLLECT_FROM_EACH_PLAYER, amount: 50 } },
  { id: 'cc_holiday',       text: 'Holiday fund matures. Collect M100.',   effect: { type: CardEffectType.COLLECT, amount: 100 } },
  { id: 'cc_jail_free',     text: 'Get Out of Jail Free.',                  effect: { type: CardEffectType.GET_OUT_OF_JAIL_FREE } },
  { id: 'cc_school',        text: 'Pay school fees of M50.',               effect: { type: CardEffectType.PAY, amount: 50 } },
  { id: 'cc_street_repair', text: 'Street repairs: M40 per house, M115 per hotel.', effect: { type: CardEffectType.REPAIRS, perHouse: 40, perHotel: 115 } },
];

const TEMPLATES: Record<string, CardTemplate> = Object.fromEntries(
  [...CHANCE, ...COMMUNITY_CHEST].map((c) => [c.id, c]),
);

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const allIds = (kind: CardKind) =>
  (kind === CardKind.CHANCE ? CHANCE : COMMUNITY_CHEST).map((c) => c.id);

/**
 * Draw the top card of the given deck for `drawerId`.
 * Returns the ActiveCard plus the updated DeckState (drawn id moved to discards).
 */
export function drawCard(
  state: GameState,
  kind: CardKind,
  drawerId: string,
): { card: ActiveCard; decks: DeckState } {
  const isChance = kind === CardKind.CHANCE;
  const drawKey    = isChance ? 'chance' : 'communityChest';
  const discardKey = isChance ? 'discardedChance' : 'discardedCommunityChest';

  let draw    = state.decks[drawKey as keyof DeckState] as string[];
  let discard = state.decks[discardKey as keyof DeckState] as string[];

  if (draw.length === 0) {
    draw    = shuffle(discard.length > 0 ? discard : allIds(kind));
    discard = [];
  }

  const [topId, ...rest] = draw;
  const template = TEMPLATES[topId] ?? TEMPLATES[allIds(kind)[0]];

  const card: ActiveCard = {
    id:       template.id,
    kind,
    text:     template.text,
    effect:   template.effect,
    drawerId,
  };

  const decks: DeckState = {
    ...state.decks,
    [drawKey]:    rest,
    [discardKey]: [...discard, topId],
  };

  return { card, decks };
}
