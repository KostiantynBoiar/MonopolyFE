'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BoardContainer } from '@/features/game-board';
import { PlayerSidebar, TOKEN_COLORS } from '@/features/player-panel';
import { BoardCenterPanel } from '@/features/chat/components/BoardCenterPanel';
import { WaitingCenterPanel, SessionStatus } from '@/features/lobby';
import { joinByCode, leaveSession, startGame } from '@/features/lobby/api';
import type { SessionMember } from '@/features/lobby';
import { BOARD } from '@/shared/config/board-layout';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useSessionStore } from '@/stores/session-store';
import { useGameSocket } from '@/shared/socket';
import type { Player } from '@/features/player-panel';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board';
import type { GameState, TradeState } from '@/shared/protocol/game-state.schema';
import { TurnPhase, LogKind, AuctionTargetKind } from '@/shared/protocol/game-state';
import { CommandType } from '@/shared/protocol/commands';
import { applyMessage, ServerEventType } from '@/shared/protocol/network';
import {
  tickAuction, advanceTurnEvent, startAuctionEvent, resetViewerTurnEvent,
} from '@/shared/mocks/mock-server';
import { getPlayerPositions } from '@/shared/protocol/selectors';
import type { TradeParticipant } from '@/features/trade';
import type { ChatMessage } from '@/features/chat/chat.types';
import { MOCK_GAME_STATE, logToChatMessages } from '@/shared/mocks/game-state.mock';
import { TOKEN_ORDER } from '@/shared/config/constants';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import type { DeedInfo } from '@/features/deed';
import type { AuctionPlayer } from '@/features/auction';
import { useGameDispatch } from './useGameDispatch';
import type { WalkState } from './useGameDispatch';

// ─── Adapters ─────────────────────────────────────────────────────────────────

function deriveSidebarPlayers(gs: GameState): Player[] {
  return gs.players.map((p) => ({
    id: p.id,
    name: p.displayName,
    balance: p.balance,
    position: p.position,
    token: p.token,
    ownedPositions: getPlayerPositions(gs, p.id),
    isActive: p.id === gs.turn.currentPlayerId,
    isBankrupt: p.isBankrupt,
    inJail: p.jailStatus !== null,
    jailTurns: p.jailStatus?.attempts,
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

function sessionMembersToPlayers(members: SessionMember[]): Player[] {
  return members.map((m, i) => ({
    id: m.user_id,
    name: m.display_name,
    balance: 0,
    position: 0,
    token: TOKEN_ORDER[i % TOKEN_ORDER.length],
    ownedPositions: [],
    isActive: false,
    isBankrupt: false,
    inJail: false,
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
    ownedPositions: getPlayerPositions(gs, p.id),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameRoomPage() {
  const router = useRouter();
  const { ready, token, user } = useRequireAuth();
  const { currentSession, clearSession, setSession } = useSessionStore();
  const [resolvingCode, setResolvingCode] = useState(false);

  // ── WebSocket (active during waiting + in-game) ────────────────────────────

  const {
    status: socketStatus,
    messages: wsMessages,
    sendChat,
    sendSticker,
    wsError,
    clearWsError,
    wasKicked,
  } = useGameSocket(currentSession?.id ?? null);

  // Gap 2: redirect if kicked
  useEffect(() => {
    if (!wasKicked) return;
    clearSession();
    router.push('/lobby?kicked=1');
  }, [wasKicked, clearSession, router]);

  // Join-by-code entry point: /game/room?code=TYC-XXXX (from landing "Join with code").
  // Resolve + join via the API, then drop into the waiting room.
  useEffect(() => {
    if (!ready || !token || currentSession) return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    setResolvingCode(true);
    let cancelled = false;
    joinByCode(token, { invite_code: code }, user?.id ?? '', user?.display_name ?? '')
      .then(({ session }) => {
        if (!cancelled) setSession(session);
      })
      .catch((err) => {
        if (!cancelled) {
          router.replace(`/lobby?error=${encodeURIComponent((err as Error).message)}`);
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingCode(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, token, currentSession, user, setSession, router]);

  // Auto-dismiss WS errors after 6 s
  useEffect(() => {
    if (!wsError) return;
    const t = setTimeout(clearWsError, 6_000);
    return () => clearTimeout(t);
  }, [wsError, clearWsError]);

  // ── Waiting room mode ──────────────────────────────────────────────────────

  const isWaiting = currentSession?.status === SessionStatus.WAITING;

  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Convert WS chat entries to ChatMessage format for the panel
  const waitingMessages: ChatMessage[] = wsMessages.map((m) => ({
    id: m.id,
    kind: m.kind === 'sticker' ? 'chat' : 'chat',
    author: m.display_name,
    text: m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
    ts: new Date(m.ts).getTime(),
  }));

  function handleWaitingMessage(text: string) {
    const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);
    if (stickerMatch) {
      sendSticker(stickerMatch[1]);
    } else {
      sendChat(text);
    }
  }

  async function handleLeave() {
    setIsLeaving(true);
    if (token && currentSession) await leaveSession(token, currentSession.id);
    clearSession();
    router.push('/lobby');
  }

  async function handleStart() {
    setIsStarting(true);
    if (token && currentSession) {
      await startGame(token, currentSession.id);
      setSession({ ...currentSession, status: SessionStatus.IN_PROGRESS });
    }
    setIsStarting(false);
  }

  // ── Game board mode ────────────────────────────────────────────────────────

  const [gameState, setGameState] = useState<GameState>(MOCK_GAME_STATE);
  const [isRolling, setIsRolling] = useState(false);
  const [walkState, setWalkState] = useState<WalkState | null>(null);
  const [activeDeed, setActiveDeed] = useState<DeedInfo | null>(null);

  // Always-fresh ref so async callbacks read current state without stale closure
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const { dispatch } = useGameDispatch(gameStateRef, {
    setGameState, setIsRolling, setWalkState, setActiveDeed,
  });

  // Tracks whether Bob's auto-bid in the current auction has already fired
  const autoBidFiredRef = useRef(false);

  const viewer = gameState.players.find((p) => p.id === gameState.viewerId)!;
  const actions = gameState.turn.actionsAvailable;

  // ── Auto-advance after post_roll — simulates server turn management ─────────

  useEffect(() => {
    if (gameState.turn.phase !== TurnPhase.POST_ROLL) return;
    if (activeDeed !== null) return;
    const isViewerTurn = gameState.turn.currentPlayerId === gameState.viewerId;
    const t = setTimeout(() => {
      const current = gameStateRef.current;
      if (isViewerTurn) {
        // Viewer manually ends turns in real play; for the mock, reset to pre_roll.
        setGameState((prev) => applyMessage(prev, resetViewerTurnEvent(current)));
      } else {
        // Simulate the opponent finishing their turn.
        setGameState((prev) => applyMessage(prev, advanceTurnEvent(current)));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [gameState.turn.phase, gameState.turn.turnNumber, gameState.turn.currentPlayerId, gameState.viewerId, activeDeed, setGameState]);

  // ── Auction countdown — simulates server ticks ────────────────────────────

  useEffect(() => {
    if (gameState.turn.phase !== TurnPhase.AUCTION) {
      autoBidFiredRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      const current = gameStateRef.current;
      if (current.turn.phase !== TurnPhase.AUCTION || !current.auction) return;

      const { messages, bobBidFired } = tickAuction(current, 1000, autoBidFiredRef.current);
      autoBidFiredRef.current = bobBidFired;
      for (const msg of messages) {
        setGameState((prev) => applyMessage(prev, msg));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.turn.phase, gameStateRef, setGameState]);

  const handleRoll = useCallback(() => {
    if (!actions.canRoll || isRolling) return;
    dispatch({ type: CommandType.RollDice });
  }, [actions.canRoll, isRolling, dispatch]);

  const handleCardProceed = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      activeCard: null,
      turn: { ...prev.turn, phase: TurnPhase.POST_ROLL },
      log: [
        ...prev.log,
        {
          id: `log_card_${Date.now()}`,
          kind: LogKind.EVENT,
          text: `${viewer.displayName} drew: "${prev.activeCard?.text ?? ''}"`,
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [viewer]);

  // ── Buy property ──────────────────────────────────────────────────────────

  const handleBuy = useCallback(() => {
    if (!activeDeed) return;
    setActiveDeed(null);
    dispatch({ type: CommandType.BuyProperty, position: activeDeed.position });
  }, [activeDeed, dispatch]);

  // ── Start auction ──────────────────────────────────────────────────────────

  const handleAuction = useCallback(() => {
    if (!activeDeed) return;
    autoBidFiredRef.current = false;
    setActiveDeed(null);
    // Server decides the transition — permissions (canBid) set by the server event.
    setGameState((prev) => applyMessage(prev, startAuctionEvent(prev, activeDeed.position)));
  }, [activeDeed, setGameState]);

  // ── Place bid ──────────────────────────────────────────────────────────────

  const handleBid = useCallback((amount: number) => {
    dispatch({ type: CommandType.BidAuction, amount });
  }, [dispatch]);

  // ── Trade handlers ─────────────────────────────────────────────────────────

  const handleTrade = useCallback(() => {
    // Mock: open a pre-filled trade proposal with Bob.
    // In real mode this would open a trade builder UI before dispatching StartTrade.
    dispatch({
      type:     CommandType.StartTrade,
      targetId: 'bob',
      offer:    { money: 100, positions: [1, 3], getOutOfJailCards: 0 },
      request:  { money: 0,   positions: [5],    getOutOfJailCards: 0 },
    });
  }, [dispatch]);

  const handleTradeAccept = useCallback(() => {
    const tradeId = gameStateRef.current.trade?.id ?? '';
    dispatch({ type: CommandType.AcceptTrade, tradeId });
    setTimeout(() => setGameState((prev) => ({ ...prev, trade: null })), 800);
  }, [dispatch, gameStateRef, setGameState]);

  const handleTradeReject = useCallback(() => {
    const tradeId = gameStateRef.current.trade?.id ?? '';
    dispatch({ type: CommandType.RejectTrade, tradeId });
    setTimeout(() => setGameState((prev) => ({ ...prev, trade: null })), 800);
  }, [dispatch, gameStateRef, setGameState]);

  // Cancel = proposer withdraws; no protocol command yet — direct mock mutation.
  const handleTradeCancel = useCallback(() => {
    setGameState((prev) => ({ ...prev, trade: null, turn: { ...prev.turn, phase: TurnPhase.PRE_ROLL } }));
  }, [setGameState]);

  const handleSendMessage = useCallback((text: string) => {
    const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);
    const isSticker = stickerMatch !== null;
    setGameState((prev) => ({
      ...prev,
      log: [
        ...prev.log,
        {
          id: `log_chat_${Date.now()}`,
          kind: isSticker ? LogKind.STICKER : LogKind.CHAT,
          playerId: prev.viewerId,
          playerName: viewer.displayName,
          playerToken: viewer.token,
          text,
          stickerUrl: stickerMatch?.[1],
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [viewer]);

  // ── Guards (all hooks above, returns below) ────────────────────────────────

  if (!ready || resolvingCode) return <FullScreenSpinner />;

  if (isWaiting && currentSession) {
    return (
      <div className="relative flex h-screen overflow-hidden bg-paper">
        <WsErrorBanner error={wsError} onDismiss={clearWsError} />
        <div className="flex-1 overflow-hidden p-4">
          <BoardContainer
            centerContent={
              <WaitingCenterPanel
                session={currentSession}
                messages={waitingMessages}
                onSendMessage={handleWaitingMessage}
                onLeave={handleLeave}
                onStart={handleStart}
                isLeaving={isLeaving}
                isStarting={isStarting}
                socketStatus={socketStatus}
              />
            }
          />
        </div>
        <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
          <PlayerSidebar players={sessionMembersToPlayers(currentSession.members)} />
        </aside>
      </div>
    );
  }

  // ── Game board ─────────────────────────────────────────────────────────────

  const tradeProposer = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.proposerId)
    : undefined;
  const tradeTarget = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.targetId)
    : undefined;

  const walkingBoardPlayers: WalkingPlayer[] = walkState
    ? [{
        id: walkState.playerId,
        currentPos: walkState.currentPos,
        tokenColor: TOKEN_COLORS[gameState.players.find((p) => p.id === walkState.playerId)!.token],
      }]
    : [];

  const auctionPropertyName = gameState.auction
    ? gameState.auction.target.kind === AuctionTargetKind.PROPERTY
    ? (BOARD[gameState.auction.target.position]?.name ?? 'Property')
    : 'Property'
    : '';

  const auctionPlayers: AuctionPlayer[] = gameState.players.map((p) => ({
    id: p.id,
    name: p.displayName,
  }));

  return (
    <div className="relative flex h-screen overflow-hidden bg-paper">
      <WsErrorBanner error={wsError} onDismiss={clearWsError} />
      <div className="flex-1 overflow-hidden p-4">
        <BoardContainer
          spaces={gameState.spaces}
          players={deriveBoardPlayers(gameState)}
          walkingPlayers={walkingBoardPlayers}
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
              activeDeed={activeDeed}
              onBuy={handleBuy}
              onAuction={handleAuction}
              auctionState={gameState.auction}
              auctionPropertyName={auctionPropertyName}
              auctionPlayers={auctionPlayers}
              canBid={actions.canBid}
              onBid={handleBid}
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
