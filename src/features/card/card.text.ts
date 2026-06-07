import { AdvanceToNearestSpaceType, CardEffectType } from './card.enums';
import type { ActiveCard } from '@/shared/protocol/game-state';

type CardTranslator = (key: string, values?: Record<string, string | number>) => string;
type TileNameResolver = (position: number) => string;

/**
 * Builds a localized description of a card from its structured `effect`.
 *
 * The backend ships a human `text` (English), but every card also carries a machine-readable
 * `effect` — so we render localized copy from that and only fall back to `text` for an effect
 * shape we don't recognise (forward-compatible with new backend effects).
 */
export function localizeCardEffect(t: CardTranslator, card: ActiveCard, resolveTileName: TileNameResolver): string {
  const effect = card.effect;

  switch (effect.type) {
    case CardEffectType.ADVANCE_TO:
      return t('effect.advanceTo', { place: resolveTileName(effect.position) });

    case CardEffectType.ADVANCE_TO_NEAREST:
      return t(
        effect.spaceType === AdvanceToNearestSpaceType.RAILROAD
          ? 'effect.advanceToNearestRailroad'
          : 'effect.advanceToNearestUtility',
      );

    case CardEffectType.GO_TO_JAIL:
      return t('effect.goToJail');

    case CardEffectType.GO_BACK:
      return t('effect.goBack', { count: effect.spaces });

    case CardEffectType.COLLECT:
      return t('effect.collect', { amount: effect.amount });

    case CardEffectType.PAY:
      return t('effect.pay', { amount: effect.amount });

    case CardEffectType.COLLECT_FROM_EACH_PLAYER:
      return t('effect.collectFromEachPlayer', { amount: effect.amount });

    case CardEffectType.PAY_EACH_PLAYER:
      return t('effect.payEachPlayer', { amount: effect.amount });

    case CardEffectType.GET_OUT_OF_JAIL_FREE:
      return t('effect.getOutOfJailFree');

    case CardEffectType.REPAIRS:
      return t('effect.repairs', { perHouse: effect.perHouse, perHotel: effect.perHotel });

    default:
      return card.text;
  }
}
