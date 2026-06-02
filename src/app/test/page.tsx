import { BoardContainer, deriveBoardPlayers, deriveSidebarPlayers } from '@/features/game-board';
import { createMockGameRoomSnapshot } from '@/shared/mocks/game-room.mock';

const MOCK_SNAPSHOT = createMockGameRoomSnapshot();

export default function TestPage() {
  const gameState = MOCK_SNAPSHOT.game;

  return (
    <main className="min-h-screen bg-paper">
      <BoardContainer
        spaces={gameState.spaces}
        players={deriveBoardPlayers(gameState)}
        sidebarPlayers={deriveSidebarPlayers(gameState)}
      />
    </main>
  );
}
