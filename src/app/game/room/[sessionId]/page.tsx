'use client';

import { GameBoardWidget } from '@/widgets/game-board';
import { MessageScreen } from '@/shared/ui/MessageScreen';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import { useGameRoomPage } from '../_hooks/useGameRoomPage';

export default function GameRoomPage() {
  const { isLoading, loadError, hasNoSession, wsError, clearWsError, isScreenShaking, widgetProps } =
    useGameRoomPage();

  if (isLoading) return <FullScreenSpinner />;

  if (loadError) {
    return (
      <MessageScreen
        tone="error"
        title="Could not load room"
        message={loadError}
        action={{ label: 'Back to lobby', href: '/lobby' }}
      />
    );
  }

  if (hasNoSession || !widgetProps) {
    return (
      <MessageScreen
        title="No active room"
        message="Join or create a room from the lobby to continue."
        action={{ label: 'Back to lobby', href: '/lobby' }}
      />
    );
  }

  return (
    <main className={`relative h-screen min-h-0 w-full overflow-hidden bg-paper${isScreenShaking ? ' ws-error-screen-shake' : ''}`}>
      <WsErrorBanner error={wsError} onDismiss={clearWsError} />
      <GameBoardWidget {...widgetProps} />
    </main>
  );
}
