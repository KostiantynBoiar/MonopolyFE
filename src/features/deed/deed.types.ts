import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { DeedSpaceType } from './deed.enums';

export interface RentRow {
  labelKey: string;
  amount: string;
}

export interface DeedInfo {
  position: number;
  name: string;
  spaceType: DeedSpaceType;
  price: number;
  color?: PropertyColor;
  rentRows: RentRow[];
  buildingCost?: number;
  mortgageValue: number;
}
