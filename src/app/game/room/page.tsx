'use client';

import { useState, useCallback, useEffect } from 'react';
import { BoardContainer } from '@/features/game-board';
import { PlayerSidebar, TOKEN_COLORS } from '@/features/player-panel';
import { BoardCenterPanel } from '@/features/chat/components/BoardCenterPanel';
import type { Player } from '@/features/player-panel';
import type { BoardPlayer } from '@/features/game-board';
import type { GameState } from '@/shared/protocol/game-state.schema';
import { MOCK_GAME_STATE, logToChatMessages } from '@/shared/mocks/game-state.mock';

// ─── Adapters ─────────────────────────────────────────────────────────────────

function deriveSidebarPlayers(gs: GameState): Player[] {
  return gs.players.map((p) => ({
    id: p.id,
    name: p.displayName,
    balance: p.balance,
    position: p.position,
    token: p.token,
    ownedPositions: p.ownedPositions,
    isActive: p.id === gs.turn.currentPlayerId,
    isBankrupt: p.isBankrupt,
    inJail: p.jailStatus !== null,
    jailTurns: p.jailStatus?.turnsRemaining,
  }));
}

function deriveBoardPlayers(gs: GameState): BoardPlayer[] {
  return gs.players.map((p) => ({
    id: p.id,
    position: p.position,
    tokenColor: TOKEN_COLORS[p.token],
    isBankrupt: p.isBankrupt,
  }));
}

// ─── Turn advance (pure) ──────────────────────────────────────────────────────

function advanceTurn(prev: GameState): GameState {
  const activePlayers = prev.players.filter((p) => !p.isBankrupt);
  const currentIdx = activePlayers.findIndex((p) => p.id === prev.turn.currentPlayerId);
  const nextPlayer = activePlayers[(currentIdx + 1) % activePlayers.length];
  const isViewerNext = nextPlayer.id === prev.viewerId;

  return {
    ...prev,
    turn: {
      ...prev.turn,
      phase: nextPlayer.jailStatus ? 'jail_decision' : 'pre_roll',
      currentPlayerId: nextPlayer.id,
      turnNumber: prev.turn.turnNumber + 1,
      diceRoll: null,
      doublesStreak: 0,
      actionsAvailable: {
        canRoll: isViewerNext,
        canBuy: false,
        canBuild: false,
        canMortgage: isViewerNext,
        canUnmortgage: isViewerNext,
        canTrade: false,
        canEndTurn: false,
        canPayJailFine: isViewerNext && nextPlayer.jailStatus !== null,
        canUseJailCard: isViewerNext && (nextPlayer.getOutOfJailCards ?? 0) > 0,
        canBid: false,
      },
    },
    log: [
      ...prev.log,
      {
        id: `log_turn_${Date.now()}`,
        kind: 'event' as const,
        text: `${nextPlayer.displayName}'s turn.`,
        ts: new Date().toISOString(),
      },
    ],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameRoomPage() {
  const [gameState, setGameState] = useState<GameState>(MOCK_GAME_STATE);
  const [isRolling, setIsRolling] = useState(false);

  const viewer = gameState.players.find((p) => p.id === gameState.viewerId)!;
  const actions = gameState.turn.actionsAvailable;

  // ── Auto-advance after post_roll ──────────────────────────────────────────
  // Deterministic: the server decides when the turn ends; no user button.
  // In the mock, we wait 2.5 s after the dice settle, then advance.

  useEffect(() => {
    if (gameState.turn.phase !== 'post_roll') return;

    const t = setTimeout(() => {
      setGameState((prev) => {
        if (prev.turn.phase !== 'post_roll') return prev;
        return advanceTurn(prev);
      });
    }, 2500);

    return () => clearTimeout(t);
  }, [gameState.turn.phase, gameState.turn.turnNumber]);

  // ── Roll dice ──────────────────────────────────────────────────────────────

  const handleRoll = useCallback(async () => {
    if (!actions.canRoll || isRolling) return;
    setIsRolling(true);

    await new Promise((r) => setTimeout(r, 1200));

    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const isDoubles = die1 === die2;
    const total = die1 + die2;
    const newPos = (viewer.position + total) % 40;

    setIsRolling(false);
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === prev.viewerId ? { ...p, position: newPos } : p,
      ),
      turn: {
        ...prev.turn,
        phase: 'post_roll',
        diceRoll: { die1, die2, isDoubles },
        doublesStreak: isDoubles ? prev.turn.doublesStreak + 1 : 0,
        actionsAvailable: {
          ...prev.turn.actionsAvailable,
          canRoll: false,
          canEndTurn: false,
        },
      },
      log: [
        ...prev.log,
        {
          id: `log_roll_${Date.now()}`,
          kind: 'event' as const,
          text: `${viewer.displayName} rolled ${die1} + ${die2} = ${total}${isDoubles ? ' (doubles!)' : ''}. Moved to space ${newPos}.`,
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [actions.canRoll, isRolling, viewer]);

  // ── Send message / sticker ─────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    (text: string) => {
      const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);
      const isSticker = stickerMatch !== null;

      setGameState((prev) => ({
        ...prev,
        log: [
          ...prev.log,
          {
            id: `log_chat_${Date.now()}`,
            kind: isSticker ? ('sticker' as const) : ('chat' as const),
            playerId: prev.viewerId,
            playerName: viewer.displayName,
            playerToken: viewer.token,
            text,
            stickerUrl: stickerMatch?.[1],
            ts: new Date().toISOString(),
          },
        ],
      }));
    },
    [viewer],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <div className="flex-1 overflow-hidden p-4">
        <BoardContainer
          spaces={gameState.spaces}
          players={deriveBoardPlayers(gameState)}
          centerContent={
            <BoardCenterPanel
              messages={logToChatMessages(gameState.log)}
              diceRoll={gameState.turn.diceRoll}
              isRolling={isRolling}
              canRoll={actions.canRoll && !isRolling}
              canBuy={actions.canBuy}
              canBuild={actions.canBuild}
              canTrade={actions.canTrade}
              onRoll={handleRoll}
              onSendMessage={handleSendMessage}
            />
          }
        />
      </div>
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <PlayerSidebar players={deriveSidebarPlayers(gameState)} />
      </aside>
    </div>
  );
}
