'use client';

import { useState, useCallback, useEffect } from 'react';
import { BoardContainer } from '@/features/game-board';
import { PlayerSidebar, TOKEN_COLORS } from '@/features/player-panel';
import { BoardCenterPanel } from '@/features/chat/components/BoardCenterPanel';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';
import type { Player } from '@/features/player-panel';
import type { BoardPlayer } from '@/features/game-board';
import type { GameState, ActiveCard, TradeState } from '@/shared/protocol/game-state.schema';
import type { TradeParticipant } from '@/features/trade';
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

function deriveTradeParticipant(gs: GameState, playerId: string): TradeParticipant | undefined {
  const p = gs.players.find((pl) => pl.id === playerId);
  if (!p) return undefined;
  return {
    id: p.id,
    name: p.displayName,
    token: p.token,
    balance: p.balance,
    ownedPositions: p.ownedPositions,
  };
}

// ─── Mock card helpers ────────────────────────────────────────────────────────

function makeMockCard(pos: number): ActiveCard | null {
  const spaceType = BOARD[pos]?.type;

  if (spaceType === SpaceType.CHANCE) {
    return {
      id: `card_chance_${Date.now()}`,
      kind: 'chance',
      text: 'Advance to GO. Collect M200.',
      effect: { type: 'advance_to', position: 0, collectGoBonus: true },
      drawerId: MOCK_GAME_STATE.viewerId,
    };
  }

  if (spaceType === SpaceType.CHEST) {
    return {
      id: `card_chest_${Date.now()}`,
      kind: 'community_chest',
      text: 'Bank error in your favor. Collect M200.',
      effect: { type: 'collect', amount: 200 },
      drawerId: MOCK_GAME_STATE.viewerId,
    };
  }

  return null;
}

function makeMockTrade(gs: GameState): TradeState {
  return {
    id: `trade_${Date.now()}`,
    proposerId: gs.viewerId,
    targetId: 'bob',
    proposerOffer: {
      money: 100,
      positions: [1, 3],
      getOutOfJailCards: 0,
    },
    targetRequest: {
      money: 0,
      positions: [5],
      getOutOfJailCards: 0,
    },
    status: 'pending',
    expiresAt: new Date(Date.now() + 120_000).toISOString(),
  };
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
        canTrade: isViewerNext,
        canEndTurn: false,
        canPayJailFine: isViewerNext && nextPlayer.jailStatus !== null,
        canUseJailCard: isViewerNext && (nextPlayer.getOutOfJailCards ?? 0) > 0,
        canBid: false,
      },
    },
    activeCard: null,
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

  // ── Auto-advance after post_roll (unless drawing a card) ──────────────────

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

    await new Promise<void>((r) => setTimeout(r, 1200));

    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const isDoubles = die1 === die2;
    const total = die1 + die2;
    const newPos = (viewer.position + total) % 40;
    const drawnCard = makeMockCard(newPos);

    setIsRolling(false);
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === prev.viewerId ? { ...p, position: newPos } : p,
      ),
      activeCard: drawnCard,
      turn: {
        ...prev.turn,
        phase: drawnCard ? 'drawing_card' : 'post_roll',
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
          text: `${viewer.displayName} rolled ${die1} + ${die2} = ${total}${isDoubles ? ' (doubles!)' : ''}. Moved to ${BOARD[newPos]?.name ?? `space ${newPos}`}.`,
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [actions.canRoll, isRolling, viewer]);

  // ── Card proceed ───────────────────────────────────────────────────────────

  const handleCardProceed = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      activeCard: null,
      turn: { ...prev.turn, phase: 'post_roll' },
      log: [
        ...prev.log,
        {
          id: `log_card_${Date.now()}`,
          kind: 'event' as const,
          text: `${viewer.displayName} drew: "${prev.activeCard?.text ?? ''}"`,
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [viewer]);

  // ── Trade handlers ─────────────────────────────────────────────────────────

  const handleTrade = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      trade: makeMockTrade(prev),
      turn: { ...prev.turn, phase: 'trade_negotiation' },
    }));
  }, []);

  const handleTradeAccept = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      trade: prev.trade ? { ...prev.trade, status: 'accepted' } : null,
      turn: { ...prev.turn, phase: 'post_roll' },
      log: [
        ...prev.log,
        {
          id: `log_trade_accept_${Date.now()}`,
          kind: 'event' as const,
          text: 'Trade accepted.',
          ts: new Date().toISOString(),
        },
      ],
    }));
    setTimeout(() => setGameState((prev) => ({ ...prev, trade: null })), 800);
  }, []);

  const handleTradeReject = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      trade: prev.trade ? { ...prev.trade, status: 'rejected' } : null,
      turn: { ...prev.turn, phase: 'post_roll' },
      log: [
        ...prev.log,
        {
          id: `log_trade_reject_${Date.now()}`,
          kind: 'event' as const,
          text: 'Trade rejected.',
          ts: new Date().toISOString(),
        },
      ],
    }));
    setTimeout(() => setGameState((prev) => ({ ...prev, trade: null })), 800);
  }, []);

  const handleTradeCancel = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      trade: null,
      turn: { ...prev.turn, phase: 'pre_roll' },
    }));
  }, []);

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

  const tradeProposer = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.proposerId)
    : undefined;

  const tradeTarget = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.targetId)
    : undefined;

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
              onTrade={handleTrade}
              activeCard={gameState.activeCard}
              onCardProceed={handleCardProceed}
              tradeState={gameState.trade}
              tradeProposer={tradeProposer}
              tradeTarget={tradeTarget}
              viewerId={gameState.viewerId}
              onTradeAccept={handleTradeAccept}
              onTradeReject={handleTradeReject}
              onTradeCancel={handleTradeCancel}
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
