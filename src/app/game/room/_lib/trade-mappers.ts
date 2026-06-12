import type { TradeAsset, TradeCounterparty, TradePlayer } from '@/features/trade-overlay/trade-builder.types';
import type { TradeParticipant } from '@/features/trade-overlay/trade.types';
import { getBoardConfig } from '@/shared/config/board-layout';
import type { GameState, PlayerState } from '@/shared/protocol/game-state';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { getPlayerProperties } from '@/shared/protocol/selectors';

export function toTradeParticipant(game: GameState, player: PlayerState): TradeParticipant {
  return {
    id: player.id,
    name: player.displayName,
    token: player.token,
    balance: player.balance,
    ownedPositions: getPlayerProperties(game, player.id).map((space) => space.position),
  };
}

export function toTradePlayer(player: PlayerState): TradePlayer {
  return {
    id: player.id,
    name: player.displayName,
    balance: player.balance,
    getOutOfJailCards: player.getOutOfJailCards,
  };
}

export function toTradeCounterparty(game: GameState, player: PlayerState): TradeCounterparty {
  return {
    ...toTradePlayer(player),
    propertyCount: getPlayerProperties(game, player.id).length,
  };
}

export function toTradeAsset(position: number, gameMode: GameMode = GameMode.NORMAL): TradeAsset {
  const { spacesByPosition } = getBoardConfig(gameMode);
  return { position, color: spacesByPosition[position]?.color };
}
