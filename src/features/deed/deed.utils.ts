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
        { label: 'Rent',          amount: `M${rent[0]}` },
        { label: 'With 1 House',  amount: `M${rent[2]}` },
        { label: 'With 2 Houses', amount: `M${rent[3]}` },
        { label: 'With 3 Houses', amount: `M${rent[4]}` },
        { label: 'With 4 Houses', amount: `M${rent[5]}` },
        { label: 'With Hotel',    amount: `M${rent[6]}` },
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
        { label: 'Rent',             amount: 'M25' },
        { label: '2 R.R. owned',     amount: 'M50' },
        { label: '3 R.R. owned',     amount: 'M100' },
        { label: '4 R.R. owned',     amount: 'M200' },
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
        { label: '1 utility owned', amount: '4× dice' },
        { label: 'Both owned',      amount: '10× dice' },
      ],
      mortgageValue: mortgageValue(position),
    };
  }

  return null;
}
