import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import type { DeedSpaceType } from './deed.enums';

export interface RentRow {
  labelKey: string;
  amount: string;
}

export interface DeedInfo {
  position: number;
  spaceType: DeedSpaceType;
  price: number;
  color?: PropertyColor;
  rentRows: RentRow[];
  buildingCost?: number;
  mortgageValue: number;
}

export interface BuildingState {
  houses: number;
  hotel: boolean;
}

export interface DeedWindowProps {
  space: BoardSpace;
  decisionSpace?: BoardSpace | null;
  onBuy?: () => void;
  onAuction?: () => void;
  canAct?: boolean;
  canBuy?: boolean;
  viewOnly?: boolean;
  compact?: boolean;
  ownership?: BuildingState | null;
}
