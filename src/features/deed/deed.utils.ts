import { SpaceType } from '@/features/game-board/game-board.enums';
import { BOARD } from '@/shared/config/board-layout';
import { RENT, buildingCost, mortgageValue } from '@/shared/protocol/board-data';
import { DeedSpaceType } from './deed.enums';
import type { DeedInfo } from './deed.types';

export function getDeedInfo(position: number): DeedInfo | null {
  const space = BOARD[position];
  if (!space) return null;

  if (space.type === SpaceType.PROPERTY) {
    const rent = RENT[position];           // [base, monopoly, 1h, 2h, 3h, 4h, hotel]
    if (!rent) return null;
    return {
      position,
      name: space.name,
      spaceType: DeedSpaceType.PROPERTY,
      price: space.price!,
      color: space.color,
      rentRows: [
        { labelKey: 'base',   amount: `M${rent[0]}` },
        { labelKey: 'house1', amount: `M${rent[2]}` },
        { labelKey: 'house2', amount: `M${rent[3]}` },
        { labelKey: 'house3', amount: `M${rent[4]}` },
        { labelKey: 'house4', amount: `M${rent[5]}` },
        { labelKey: 'hotel',  amount: `M${rent[6]}` },
      ],
      buildingCost: buildingCost(position),
      mortgageValue: mortgageValue(position),
    };
  }

  if (space.type === SpaceType.RAILROAD) {
    return {
      position,
      name: space.name,
      spaceType: DeedSpaceType.RAILROAD,
      price: space.price!,
      rentRows: [
        { labelKey: 'railroad1', amount: 'M25' },
        { labelKey: 'railroad2', amount: 'M50' },
        { labelKey: 'railroad3', amount: 'M100' },
        { labelKey: 'railroad4', amount: 'M200' },
      ],
      mortgageValue: mortgageValue(position),
    };
  }

  if (space.type === SpaceType.UTILITY) {
    return {
      position,
      name: space.name,
      spaceType: DeedSpaceType.UTILITY,
      price: space.price!,
      rentRows: [
        { labelKey: 'utility1',    amount: '4× dice' },
        { labelKey: 'utilityBoth', amount: '10× dice' },
      ],
      mortgageValue: mortgageValue(position),
    };
  }

  return null;
}
