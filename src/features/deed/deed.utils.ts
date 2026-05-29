import { SpaceType } from '@/features/game-board/game-board.enums';
import { BOARD } from '@/shared/config/board-layout';
import { DeedSpaceType } from './deed.enums';
import type { DeedInfo } from './deed.types';

type PropertyRentData = {
  base: number; house1: number; house2: number;
  house3: number; house4: number; hotel: number;
  buildingCost: number;
};

const PROPERTY_RENT: Record<number, PropertyRentData> = {
  1:  { base:  2, house1:  10, house2:  30, house3:   90, house4:  160, hotel:  250, buildingCost:  50 },
  3:  { base:  4, house1:  20, house2:  60, house3:  180, house4:  320, hotel:  450, buildingCost:  50 },
  6:  { base:  6, house1:  30, house2:  90, house3:  270, house4:  400, hotel:  550, buildingCost:  50 },
  8:  { base:  6, house1:  30, house2:  90, house3:  270, house4:  400, hotel:  550, buildingCost:  50 },
  9:  { base:  8, house1:  40, house2: 100, house3:  300, house4:  450, hotel:  600, buildingCost:  50 },
  11: { base: 10, house1:  50, house2: 150, house3:  450, house4:  625, hotel:  750, buildingCost: 100 },
  13: { base: 10, house1:  50, house2: 150, house3:  450, house4:  625, hotel:  750, buildingCost: 100 },
  14: { base: 12, house1:  60, house2: 180, house3:  500, house4:  700, hotel:  900, buildingCost: 100 },
  16: { base: 14, house1:  70, house2: 200, house3:  550, house4:  750, hotel:  950, buildingCost: 100 },
  18: { base: 14, house1:  70, house2: 200, house3:  550, house4:  750, hotel:  950, buildingCost: 100 },
  19: { base: 16, house1:  80, house2: 220, house3:  600, house4:  800, hotel: 1000, buildingCost: 100 },
  21: { base: 18, house1:  90, house2: 250, house3:  700, house4:  875, hotel: 1050, buildingCost: 150 },
  23: { base: 18, house1:  90, house2: 250, house3:  700, house4:  875, hotel: 1050, buildingCost: 150 },
  24: { base: 20, house1: 100, house2: 300, house3:  750, house4:  925, hotel: 1100, buildingCost: 150 },
  26: { base: 22, house1: 110, house2: 330, house3:  800, house4:  975, hotel: 1150, buildingCost: 150 },
  27: { base: 22, house1: 110, house2: 330, house3:  800, house4:  975, hotel: 1150, buildingCost: 150 },
  29: { base: 24, house1: 120, house2: 360, house3:  850, house4: 1025, hotel: 1200, buildingCost: 150 },
  31: { base: 26, house1: 130, house2: 390, house3:  900, house4: 1100, hotel: 1275, buildingCost: 200 },
  32: { base: 26, house1: 130, house2: 390, house3:  900, house4: 1100, hotel: 1275, buildingCost: 200 },
  34: { base: 28, house1: 150, house2: 450, house3: 1000, house4: 1200, hotel: 1400, buildingCost: 200 },
  37: { base: 35, house1: 175, house2: 500, house3: 1100, house4: 1300, hotel: 1500, buildingCost: 200 },
  39: { base: 50, house1: 200, house2: 600, house3: 1400, house4: 1700, hotel: 2000, buildingCost: 200 },
};

export function getDeedInfo(position: number): DeedInfo | null {
  const space = BOARD[position];
  if (!space) return null;

  if (space.type === SpaceType.PROPERTY) {
    const rent = PROPERTY_RENT[position];
    if (!rent) return null;
    return {
      position,
      name: space.name,
      spaceType: DeedSpaceType.PROPERTY,
      price: space.price!,
      color: space.color,
      rentRows: [
        { label: 'Rent',          amount: `M${rent.base}` },
        { label: 'With 1 House',  amount: `M${rent.house1}` },
        { label: 'With 2 Houses', amount: `M${rent.house2}` },
        { label: 'With 3 Houses', amount: `M${rent.house3}` },
        { label: 'With 4 Houses', amount: `M${rent.house4}` },
        { label: 'With Hotel',    amount: `M${rent.hotel}` },
      ],
      buildingCost: rent.buildingCost,
      mortgageValue: Math.floor(space.price! / 2),
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
      mortgageValue: 100,
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
      mortgageValue: 75,
    };
  }

  return null;
}
