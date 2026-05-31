import type { PropertyColor } from '@/features/game-board';
import type { DeedSpaceType } from './deed.enums';

export type RentRow = {
  label: string;
  amount: string;
};

export type DeedInfo = {
  position: number;
  name: string;
  spaceType: DeedSpaceType;
  price: number;
  color?: PropertyColor;
  rentRows: RentRow[];
  buildingCost?: number;
  mortgageValue: number;
};

export type DeedCardProps = {
  deed: DeedInfo;
  canBuy: boolean;
  canManage: boolean;
  onBuy: () => void;
  onAuction: () => void;
  onManage: () => void;
  viewOnly?: boolean;
};
