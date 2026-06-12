import { CornerVariant, SpaceType } from '@/features/game-board/game-board.enums';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import type { DeedInfo } from './deed.types';
import { DeedSpaceType } from './deed.enums';

type DeedTranslator = (key: string, values?: Record<string, string | number>) => string;

export function getRentTitle(deed: DeedInfo, t: DeedTranslator): string {
  switch (deed.spaceType) {
    case DeedSpaceType.RAILROAD: return t('rentTitle.railroad');
    case DeedSpaceType.UTILITY:  return t('rentTitle.utility');
    default:                     return t('rentTitle.default');
  }
}

export function formatLabel(key: string, t: DeedTranslator): string {
  const MAP: Record<string, string> = {
    base:        t('row.base'),
    house1:      t('row.house1'),
    house2:      t('row.house2'),
    house3:      t('row.house3'),
    house4:      t('row.house4'),
    hotel:       t('row.hotel'),
    railroad1:   t('row.railroad1'),
    railroad2:   t('row.railroad2'),
    railroad3:   t('row.railroad3'),
    railroad4:   t('row.railroad4'),
    utility1:    t('row.utility1'),
    utilityBoth: t('row.utilityBoth'),
  };
  return MAP[key] ?? key;
}

export function getCornerText(corner: CornerVariant | undefined, t: DeedTranslator) {
  switch (corner) {
    case CornerVariant.GO:        return { eyebrow: t('corner.eyebrow'), title: t('corner.go.title'),       value: t('corner.go.value') };
    case CornerVariant.JAIL:      return { eyebrow: t('corner.eyebrow'), title: t('corner.jail.title'),     value: t('corner.jail.value') };
    case CornerVariant.PARKING:   return { eyebrow: t('corner.eyebrow'), title: t('corner.parking.title'), value: t('corner.parking.value') };
    case CornerVariant.GOTO_JAIL: return { eyebrow: t('corner.eyebrow'), title: t('corner.gotoJail.title'), value: t('corner.gotoJail.value') };
    default:                      return { eyebrow: t('corner.eyebrow'), title: t('corner.default.title'),  value: t('corner.default.value') };
  }
}

export function getSpecialText(space: BoardSpace, t: DeedTranslator): string {
  switch (space.type) {
    case SpaceType.CHANCE: return t('special.chance');
    case SpaceType.CHEST:  return t('special.chest');
    case SpaceType.TAX:    return t('special.tax', { amount: space.price ?? 0 });
    default:               return t('special.default');
  }
}
