import { SpaceType } from '@/features/game-board/game-board.enums';
import { getBoardConfig } from '@/shared/config/board-layout';
import { getBoardData, buildingCost, mortgageValue } from '@/shared/protocol/board-data';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { DeedSpaceType } from './deed.enums';
import type { DeedInfo } from './deed.types';

export function getDeedInfo(position: number, gameMode: GameMode = GameMode.NORMAL): DeedInfo | null {
  const { spacesByPosition } = getBoardConfig(gameMode);
  const space = spacesByPosition[position];
  if (!space) return null;

  const { rent } = getBoardData(gameMode);

  if (space.type === SpaceType.PROPERTY) {
    const rentRow = rent[position];
    if (!rentRow) return null;
    return {
      position,
      spaceType: DeedSpaceType.PROPERTY,
      price: space.price!,
      color: space.color,
      rentRows: [
        { labelKey: 'base',   amount: `M${rentRow[0]}` },
        { labelKey: 'house1', amount: `M${rentRow[2]}` },
        { labelKey: 'house2', amount: `M${rentRow[3]}` },
        { labelKey: 'house3', amount: `M${rentRow[4]}` },
        { labelKey: 'house4', amount: `M${rentRow[5]}` },
        { labelKey: 'hotel',  amount: `M${rentRow[6]}` },
      ],
      buildingCost: buildingCost(position, gameMode),
      mortgageValue: mortgageValue(position, gameMode),
    };
  }

  if (space.type === SpaceType.RAILROAD) {
    return {
      position,
      spaceType: DeedSpaceType.RAILROAD,
      price: space.price!,
      rentRows: [
        { labelKey: 'railroad1', amount: 'M25' },
        { labelKey: 'railroad2', amount: 'M50' },
        { labelKey: 'railroad3', amount: 'M100' },
        { labelKey: 'railroad4', amount: 'M200' },
      ],
      mortgageValue: mortgageValue(position, gameMode),
    };
  }

  if (space.type === SpaceType.UTILITY) {
    return {
      position,
      spaceType: DeedSpaceType.UTILITY,
      price: space.price!,
      rentRows: [
        { labelKey: 'utility1',    amount: '4× dice' },
        { labelKey: 'utilityBoth', amount: '10× dice' },
      ],
      mortgageValue: mortgageValue(position, gameMode),
    };
  }

  return null;
}
