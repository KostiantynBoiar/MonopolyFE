import type { TradeAsset, TradeCounterparty, TradePlayer } from '@/features/trade/components/TradeBuilder';
import type { TradeParticipant } from '@/features/trade/trade.types';
import { BOARD } from '@/shared/config/board-layout';
import type { GameState, PlayerState } from '@/shared/protocol/game-state';
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

export function toTradeAsset(position: number): TradeAsset {
  return { position, color: BOARD[position]?.color };
}
