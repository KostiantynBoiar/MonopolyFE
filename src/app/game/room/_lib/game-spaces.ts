import type { ManageProperty } from '@/features/manage-overlay/ManagePropertiesOverlay';
import { getBoardConfig } from '@/shared/config/board-layout';
import type { GameState } from '@/shared/protocol/game-state';
import { getPlayerProperties, getPropertyRent, hasMonopoly } from '@/shared/protocol/selectors';

export function getSpaceOwnerId(game: GameState, position: number): string | null {
  return game.spaces.find((space) => space.position === position)?.ownerId ?? null;
}

export function isSpaceMortgaged(game: GameState, position: number): boolean {
  return game.spaces.find((space) => space.position === position)?.isMortgaged ?? false;
}

export function getManageProperties(game: GameState, viewerPlayerId: string | null): ManageProperty[] {
  if (!viewerPlayerId) return [];
  const { spacesByPosition } = getBoardConfig(game.gameMode);
  return getPlayerProperties(game, viewerPlayerId).map((space) => {
    const boardSpace = spacesByPosition[space.position];
    const color      = boardSpace?.color;
    return {
      position: space.position,
      color,
      houses: space.houses,
      hotel: space.hotel,
      isMortgaged: space.isMortgaged,
      inMonopoly: color ? hasMonopoly(game, viewerPlayerId, color) : false,
      rent: getPropertyRent(game, space.position),
    };
  });
}
