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
import { useSessionStore, useGameStore, useSocketStore, useUiStore } from '@/stores';
import { useGameSocket } from '@/shared/socket';
import type { Player } from '@/features/player-panel';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board';
import type { GameState, TradeState } from '@/shared/protocol/game-state.schema';
import { TurnPhase, LogKind, AuctionTargetKind, GameEventType, CardKind } from '@/shared/protocol/game-state';
import { makeEventEntry } from '@/shared/protocol/log';
import { CommandType } from '@/shared/protocol/commands';
import {
  tickAuction, advanceTurnEvent, startAuctionEvent, resetViewerTurnEvent,
} from '@/shared/mocks/mock-server';
import { getPlayerPositions } from '@/shared/protocol/selectors';
import type { TradeParticipant } from '@/features/trade';
import type { ChatMessage } from '@/features/chat/chat.types';
import { TOKEN_ORDER } from '@/shared/config/constants';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import type { AuctionPlayer } from '@/features/auction';
import { useGameDispatch } from './useGameDispatch';

// ─── Adapters ─────────────────────────────────────────────────────────────────

function deriveSidebarPlayers(gs: GameState): Player[] {
  return gs.players.map((p) => ({
    id:             p.id,
    name:           p.displayName,
    balance:        p.balance,
    position:       p.position,
    token:          p.token,
    ownedPositions: getPlayerPositions(gs, p.id),
    isActive:       p.id === gs.turn.currentPlayerId,
    isBankrupt:     p.isBankrupt,
    inJail:         p.jailStatus !== null,
    jailTurns:      p.jailStatus?.attempts,
  }));
}

function deriveBoardPlayers(gs: GameState): BoardPlayer[] {
  return gs.players.map((p) => ({
    id:         p.id,
    position:   p.position,
    tokenColor: TOKEN_COLORS[p.token],
    isBankrupt: p.isBankrupt,
  }));
}

function sessionMembersToPlayers(members: SessionMember[]): Player[] {
  return members.map((m, i) => ({
    id:             m.user_id,
    name:           m.display_name,
    balance:        0,
    position:       0,
    token:          TOKEN_ORDER[i % TOKEN_ORDER.length],
    ownedPositions: [],
    isActive:       false,
    isBankrupt:     false,
    inJail:         false,
  }));
}

function deriveTradeParticipant(gs: GameState, playerId: string): TradeParticipant | undefined {
  const p = gs.players.find((pl) => pl.id === playerId);
  if (!p) return undefined;
  return {
    id:             p.id,
    name:           p.displayName,
    token:          p.token,
    balance:        p.balance,
    ownedPositions: getPlayerPositions(gs, p.id),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameRoomPage() {
  const router = useRouter();
  const { ready, token, user } = useRequireAuth();
  const { currentSession, clearSession, setSession } = useSessionStore();
  const [resolvingCode, setResolvingCode] = useState(false);

  // ── Stores ────────────────────────────────────────────────────────────────

  const { snapshot, setSnapshot, applyServerMessage, updateGame } = useGameStore();
  const { game: gameState, permissions } = snapshot;

  const {
    status: socketStatus,
    messages: wsMessages,
    wsError,
    wasKicked,
    clearWsError,
  } = useSocketStore();

  const { isRolling, walkState, activeDeed, setActiveDeed } = useUiStore();

  // ── WebSocket ─────────────────────────────────────────────────────────────

  const { sendChat, sendSticker } = useGameSocket(currentSession?.id ?? null);

  useEffect(() => {
    if (!wasKicked) return;
    clearSession();
    router.push('/lobby?kicked=1');
  }, [wasKicked, clearSession, router]);

  useEffect(() => {
    if (!ready || !token || currentSession) return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    setResolvingCode(true);
    let cancelled = false;
    joinByCode(token, { invite_code: code }, user?.id ?? '', user?.display_name ?? '')
      .then(({ session }) => { if (!cancelled) setSession(session); })
      .catch((err) => {
        if (!cancelled) router.replace(`/lobby?error=${encodeURIComponent((err as Error).message)}`);
      })
      .finally(() => { if (!cancelled) setResolvingCode(false); });
    return () => { cancelled = true; };
  }, [ready, token, currentSession, user, setSession, router]);

  useEffect(() => {
    if (!wsError) return;
    const t = setTimeout(clearWsError, 6_000);
    return () => clearTimeout(t);
  }, [wsError, clearWsError]);

  // ── Waiting room mode ─────────────────────────────────────────────────────

  const isWaiting = currentSession?.status === SessionStatus.WAITING;

  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const waitingMessages: ChatMessage[] = wsMessages.map((m) => ({
    id:     m.id,
    kind:   'chat',
    author: m.display_name,
    text:   m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
    ts:     new Date(m.ts).getTime(),
  }));

  function handleWaitingMessage(text: string) {
    const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);
    stickerMatch ? sendSticker(stickerMatch[1]) : sendChat(text);
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

  // ── Game board mode ───────────────────────────────────────────────────────

  const autoBidFiredRef = useRef(false);

  const { dispatch } = useGameDispatch();

  // Auto-advance after post_roll — simulates server turn management
  useEffect(() => {
    if (gameState.turn.phase !== TurnPhase.POST_ROLL) return;
    if (activeDeed !== null) return;
    const t = setTimeout(() => {
      // Re-read isViewerTurn from fresh store state — never use a stale closure value
      // captured at effect time, because the turn may have changed during the 1500 ms window.
      const current = useGameStore.getState().snapshot.game;
      const isViewerTurnNow = current.turn.currentPlayerId === current.viewerId;
      applyServerMessage(
        isViewerTurnNow ? resetViewerTurnEvent(current) : advanceTurnEvent(current),
      );
    }, 1500);
    return () => clearTimeout(t);
  }, [
    gameState.turn.phase, gameState.turn.turnNumber,
    gameState.turn.currentPlayerId, gameState.viewerId,
    activeDeed, applyServerMessage,
  ]);

  // Auction countdown — simulates server ticks
  useEffect(() => {
    if (gameState.turn.phase !== TurnPhase.AUCTION) {
      autoBidFiredRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      const current = useGameStore.getState().snapshot.game;
      if (current.turn.phase !== TurnPhase.AUCTION || !current.auction) return;

      const { messages, bobBidFired } = tickAuction(current, 1000, autoBidFiredRef.current);
      autoBidFiredRef.current = bobBidFired;
      for (const msg of messages) applyServerMessage(msg);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.turn.phase, applyServerMessage]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // viewer is derived here (after all hooks) rather than at the top of the component,
  // so an unmatched viewerId (e.g. during initialization) doesn't crash before the
  // !ready / isWaiting guards below.
  const viewer = gameState.players.find((p) => p.id === gameState.viewerId) ?? null;

  const handleRoll = useCallback(() => {
    if (!permissions.canRoll || isRolling) return;
    dispatch({ type: CommandType.RollDice });
  }, [permissions.canRoll, isRolling, dispatch]);

  const handleCardProceed = useCallback(() => {
    const card = useGameStore.getState().snapshot.game.activeCard;
    updateGame((g) => ({
      ...g,
      activeCard: null,
      turn: { ...g.turn, phase: TurnPhase.POST_ROLL },
      log: [...g.log, makeEventEntry({
        type: GameEventType.CardDrawn,
        playerId: g.viewerId, playerName: viewer?.displayName ?? '',
        cardKind: card?.kind ?? CardKind.CHANCE, text: card?.text ?? '',
      })],
    }));
  }, [viewer?.displayName, updateGame]);

  const handleBuy = useCallback(() => {
    if (!activeDeed) return;
    setActiveDeed(null);
    dispatch({ type: CommandType.BuyProperty, position: activeDeed.position });
  }, [activeDeed, dispatch, setActiveDeed]);

  const handleAuction = useCallback(() => {
    if (!activeDeed) return;
    autoBidFiredRef.current = false;
    setActiveDeed(null);
    applyServerMessage(startAuctionEvent(useGameStore.getState().snapshot.game, activeDeed.position));
  }, [activeDeed, applyServerMessage, setActiveDeed]);

  const handleBid = useCallback((amount: number) => {
    dispatch({ type: CommandType.BidAuction, amount });
  }, [dispatch]);

  const handleTrade = useCallback(() => {
    dispatch({
      type: CommandType.StartTrade, targetId: 'bob',
      offer:   { money: 100, positions: [1, 3], getOutOfJailCards: 0 },
      request: { money: 0,   positions: [5],    getOutOfJailCards: 0 },
    });
  }, [dispatch]);

  const handleTradeAccept = useCallback(() => {
    const tradeId = useGameStore.getState().snapshot.game.trade?.id ?? '';
    dispatch({ type: CommandType.AcceptTrade, tradeId });
    // Clear the resolved trade after the result animation — but only if it's still
    // the same trade. A newer trade/counter-offer arriving in the window is left intact.
    setTimeout(() => updateGame((g) => (g.trade?.id === tradeId ? { ...g, trade: null } : g)), 800);
  }, [dispatch, updateGame]);

  const handleTradeReject = useCallback(() => {
    const tradeId = useGameStore.getState().snapshot.game.trade?.id ?? '';
    dispatch({ type: CommandType.RejectTrade, tradeId });
    setTimeout(() => updateGame((g) => (g.trade?.id === tradeId ? { ...g, trade: null } : g)), 800);
  }, [dispatch, updateGame]);

  const handleTradeCancel = useCallback(() => {
    updateGame((g) => ({ ...g, trade: null, turn: { ...g.turn, phase: TurnPhase.PRE_ROLL } }));
  }, [updateGame]);

  const handleSendMessage = useCallback((text: string) => {
    const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);
    const isSticker    = stickerMatch !== null;
    updateGame((g) => ({
      ...g,
      log: [...g.log, {
        id: `log_chat_${Date.now()}`,
        kind: isSticker ? LogKind.STICKER : LogKind.CHAT,
        playerId:    g.viewerId,
        playerName:  viewer?.displayName,
        playerToken: viewer?.token,
        text,
        stickerUrl:  stickerMatch?.[1],
        ts: new Date().toISOString(),
      }],
    }));
  }, [viewer?.displayName, viewer?.token, updateGame]);

  // ── Guards ────────────────────────────────────────────────────────────────

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

  // ── Game board ────────────────────────────────────────────────────────────

  const tradeProposer = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.proposerId) : undefined;
  const tradeTarget = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.targetId)   : undefined;

  const walkingToken = walkState
    ? gameState.players.find((p) => p.id === walkState.playerId)?.token
    : undefined;
  const walkingBoardPlayers: WalkingPlayer[] = walkState && walkingToken
    ? [{ id: walkState.playerId, currentPos: walkState.currentPos, tokenColor: TOKEN_COLORS[walkingToken] }]
    : [];

  const auctionPropertyName = gameState.auction
    ? gameState.auction.target.kind === AuctionTargetKind.PROPERTY
      ? (BOARD[gameState.auction.target.position]?.name ?? 'Property')
      : 'Property'
    : '';

  const auctionPlayers: AuctionPlayer[] = gameState.players.map((p) => ({
    id: p.id, name: p.displayName,
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
              log={gameState.log}
              diceRoll={gameState.turn.diceRoll}
              isRolling={isRolling}
              canRoll={permissions.canRoll && !isRolling}
              canBuy={permissions.canBuyProperty}
              canBuild={permissions.canBuildHouse || permissions.canBuildHotel}
              canTrade={permissions.canTrade}
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
              canBid={permissions.canBidAuction}
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
