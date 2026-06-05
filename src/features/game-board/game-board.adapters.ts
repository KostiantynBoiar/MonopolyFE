import type { Player } from '@/features/player-panel';
import { TOKEN_COLORS } from '@/shared/config/constants';
import type { GameState } from '@/shared/protocol/game-state';
import { getPlayerPositions } from '@/shared/protocol/selectors';
import type { BoardPlayer } from './game-board.types';
import { resolveTokenShape } from './token-shapes';

export function deriveSidebarPlayers(gs: GameState): Player[] {
  return gs.players.map((p) => ({
    id:             p.id,
    name:           p.displayName,
    balance:        p.balance,
    position:       p.position,
    token:          p.token,
    avatarUrl:      p.avatarUrl,
    ownedPositions: getPlayerPositions(gs, p.id),
    isActive:       p.id === gs.turn.currentPlayerId,
    isBankrupt:     p.isBankrupt,
    inJail:         p.jailStatus !== null,
    jailTurns:      p.jailStatus?.attempts,
  }));
}

export function deriveBoardPlayers(gs: GameState): BoardPlayer[] {
  return gs.players.map((p) => ({
    id:         p.id,
    position:   p.position,
    tokenColor: TOKEN_COLORS[p.token],
    tokenShape: resolveTokenShape(gs.gameId, p.turnOrder),
    isBankrupt: p.isBankrupt,
    inJail:     p.jailStatus != null,
    avatarUrl:  p.avatarUrl,
  }));
}
