'use client';

import { useCallback, useEffect } from 'react';
import { BoardContainer, deriveBoardPlayers, deriveSidebarPlayers } from '@/features/game-board';
import type { WalkingPlayer } from '@/features/game-board';
import { TOKEN_COLORS } from '@/features/player-panel';
import { createMockGameRoomSnapshot } from '@/shared/mocks/game-room.mock';
import type { GameState } from '@/shared/protocol/game-state';
import { TurnPhase } from '@/shared/protocol/game-state.enums';
import { adaptGameStateFrame, type BeGameState } from '@/shared/transport/state-adapter';
import { enqueueSnapshot, resetSnapshotPipeline } from '@/shared/socket/snapshot-animator';
import { useGameStore, useUiStore } from '@/stores';

const MOCK_SNAPSHOT = createMockGameRoomSnapshot();

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function buildMockBackendRollFrame(game: GameState): BeGameState {
  const currentPlayer = game.players.find((player) => player.id === game.turn.currentPlayerId) ?? game.players[0];
  const die1 = rollDie();
  const die2 = rollDie();
  const total = die1 + die2;
  const from = currentPlayer?.position ?? 0;
  const to = (from + total) % 40;

  return {
    game_id: game.gameId,
    session_code: game.sessionCode,
    status: game.status,
    created_at: game.createdAt,
    started_at: game.startedAt,
    finished_at: game.finishedAt,
    winner_id: game.winnerId,
    viewer_id: game.viewerId,
    players: game.players.map((player) => ({
      id: player.id,
      user_id: player.userId,
      display_name: player.displayName,
      token: player.token,
      avatar_url: player.avatarUrl,
      turn_order: player.turnOrder,
      position: player.id === currentPlayer?.id ? to : player.position,
      balance: player.balance,
      owned_positions: [],
      get_out_of_jail_cards: player.getOutOfJailCards,
      jail_status: player.jailStatus ? { turns_remaining: player.jailStatus.attempts } : null,
      is_bankrupt: player.isBankrupt,
      is_connected: player.isConnected,
    })),
    turn: {
      phase: TurnPhase.POST_ROLL,
      current_player_id: currentPlayer?.id ?? game.turn.currentPlayerId,
      turn_number: game.turn.turnNumber,
      round_number: game.turn.roundNumber,
      dice_roll: {
        die1,
        die2,
        is_doubles: die1 === die2,
      },
      doubles_streak: die1 === die2 ? game.turn.doublesStreak + 1 : 0,
      actions_available: {
        can_roll: false,
        can_end_turn: true,
      },
      pending_buy_position: null,
    },
    spaces: game.spaces.map((space) => ({
      position: space.position,
      owner_id: space.ownerId,
      houses: space.houses,
      has_hotel: space.hotel,
      is_mortgaged: space.isMortgaged,
    })),
    auction: null,
    trade: null,
    active_card: null,
    bankruptcy: null,
    bank_houses: game.bank.availableHouses,
    bank_hotels: game.bank.availableHotels,
    log: game.log.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      text: entry.text,
      ts: entry.ts,
      player_id: entry.playerId,
      player_name: entry.playerName,
      player_token: entry.playerToken,
      sticker_url: entry.stickerUrl,
    })),
    animation_timeline: currentPlayer
      ? [
          {
            type: 'roll_dice',
            player_id: currentPlayer.id,
            die1,
            die2,
            is_doubles: die1 === die2,
          },
          {
            type: 'move',
            player_id: currentPlayer.id,
            from_position: from,
            to_position: to,
            speed: 'normal',
            reason: 'dice',
          },
        ]
      : [],
  };
}

export default function TestPage() {
  const snapshot = useGameStore((state) => state.snapshot);
  const {
    walkState,
    isTimelineRunning,
    animatedDiceRoll,
    animatedDiceRollId,
    pendingAnimationInteraction,
  } = useUiStore();
  const gameState = snapshot.game.gameId ? snapshot.game : MOCK_SNAPSHOT.game;
  const displayedDiceRoll = animatedDiceRoll ?? gameState.turn.diceRoll;
  const displayedDiceRollId = animatedDiceRoll ? animatedDiceRollId : 0;

  useEffect(() => {
    resetSnapshotPipeline();
    useGameStore.getState().setSnapshot(MOCK_SNAPSHOT);

    return () => {
      resetSnapshotPipeline();
      useGameStore.getState().reset();
    };
  }, []);

  const handleMockRoll = useCallback(() => {
    if (isTimelineRunning || pendingAnimationInteraction) return;

    const latestGame = useGameStore.getState().snapshot.game;
    const sourceGame = latestGame.gameId ? latestGame : MOCK_SNAPSHOT.game;
    const backendFrame = buildMockBackendRollFrame(sourceGame);
    enqueueSnapshot(adaptGameStateFrame(backendFrame));
  }, [isTimelineRunning, pendingAnimationInteraction]);

  const walkingToken = walkState
    ? gameState.players.find((player) => player.id === walkState.playerId)?.token
    : undefined;
  const walkingPlayers: WalkingPlayer[] = walkState && walkingToken
    ? [{
        id: walkState.playerId,
        currentPos: walkState.currentPos,
        tokenColor: TOKEN_COLORS[walkingToken],
        fast: walkState.fast,
      }]
    : [];

  return (
    <main className="min-h-screen bg-paper">
      <BoardContainer
        spaces={gameState.spaces}
        players={deriveBoardPlayers(gameState)}
        walkingPlayers={walkingPlayers}
        sidebarPlayers={deriveSidebarPlayers(gameState)}
        diceRoll={displayedDiceRoll}
        diceRollId={displayedDiceRollId}
        onRollDice={handleMockRoll}
      />
    </main>
  );
}
