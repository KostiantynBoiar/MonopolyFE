import { BoardContainer } from '@/features/game-board';
import { PlayerSidebar } from '@/features/player-panel';
import { BoardCenterPanel } from '@/features/chat/components/BoardCenterPanel';
import type { Player } from '@/features/player-panel';
import { MOCK_GAME_STATE, logToChatMessages } from '@/shared/mocks/game-state.mock';

// ─── Adapt game state → component props ───────────────────────────────────────

const PLAYERS: Player[] = MOCK_GAME_STATE.players.map((p) => ({
  id: p.id,
  name: p.displayName,
  balance: p.balance,
  position: p.position,
  token: p.token,
  ownedPositions: p.ownedPositions,
  isActive: p.id === MOCK_GAME_STATE.turn.currentPlayerId,
  isBankrupt: p.isBankrupt,
  inJail: p.jailStatus !== null,
  jailTurns: p.jailStatus?.turnsRemaining,
}));

const MESSAGES = logToChatMessages(MOCK_GAME_STATE.log);
const ACTIONS = MOCK_GAME_STATE.turn.actionsAvailable;

export default function GameRoomPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Board — fills remaining space */}
      <div className="flex-1 overflow-hidden p-4">
        <BoardContainer
          centerContent={
            <BoardCenterPanel
              messages={MESSAGES}
              canRoll={ACTIONS.canRoll}
              canBuy={ACTIONS.canBuy}
              canBuild={ACTIONS.canBuild}
              canTrade={ACTIONS.canTrade}
              canEndTurn={ACTIONS.canEndTurn}
            />
          }
        />
      </div>

      {/* Right panel — players */}
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <PlayerSidebar players={PLAYERS} />
      </aside>
    </div>
  );
}
