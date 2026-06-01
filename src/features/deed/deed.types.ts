import type { PropertyColor } from '@/features/game-board';
import type { DeedSpaceType } from './deed.enums';

export interface RentRow {
  /** Translation key within the `Deed.rent` namespace (e.g. `'base'`, `'house1'`). */
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

export interface DeedCardProps {
  deed: DeedInfo;
  canBuy: boolean;
  canManage: boolean;
  onBuy: () => void;
  onAuction: () => void;
  onManage: () => void;
  viewOnly?: boolean;
}
