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
import { TurnPhase, LogKind, AuctionTargetKind, GameStatus } from '@/shared/protocol/game-state';
import { CommandType } from '@/shared/protocol/commands';
import {
  tickAuction, advanceTurnEvent, startAuctionEvent,
} from '@/shared/mocks/mock-server';
import { runOpponentTurn, opponentRespondToTrade } from '@/shared/mocks/opponent-ai';
import { getPlayerPositions, getPlayerProperties, getPropertyRent, hasMonopoly } from '@/shared/protocol/selectors';
import { ManagePropertiesModal } from '@/features/manage';
import type { ManageProperty } from '@/features/manage';
import type { TradeParticipant, TradeAsset } from '@/features/trade';
import { TradeBuilder } from '@/features/trade';
import type { TradeOffer } from '@/shared/protocol/game-state';
import type { ChatMessage } from '@/features/chat/chat.types';
import { TOKEN_ORDER } from '@/shared/config/constants';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import type { AuctionPlayer } from '@/features/auction';
import { useGameDispatch } from './useGameDispatch';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

  const { isRolling, walkState, activeDeed, setActiveDeed, openedModal, setOpenedModal } = useUiStore();

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
  const opponentTurnRef = useRef(false);
  const mountedRef      = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const { dispatch } = useGameDispatch();

  // End the viewer's turn automatically after POST_ROLL (no explicit End Turn button yet).
  // advanceTurnEvent re-rolls the viewer on doubles (extraTurn) or hands off to the next player.
  useEffect(() => {
    if (gameState.turn.phase !== TurnPhase.POST_ROLL) return;
    if (gameState.turn.currentPlayerId !== gameState.viewerId) return;
    if (activeDeed !== null) return;
    if (openedModal !== null) return;   // don't end the turn while a modal is open
    const t = setTimeout(() => {
      applyServerMessage(advanceTurnEvent(useGameStore.getState().snapshot.game));
    }, 1500);
    return () => clearTimeout(t);
  }, [
    gameState.turn.phase, gameState.turn.turnNumber,
    gameState.turn.currentPlayerId, gameState.viewerId,
    activeDeed, openedModal, applyServerMessage,
  ]);

  // Drive opponents' turns. A self-contained async loop plays each opponent turn
  // (reading fresh state every step), applying snapshots on a timer so the human
  // watches it happen. The ref guard prevents re-entry; crucially there is NO cleanup
  // that cancels playback — applying a snapshot changes this effect's deps, and a
  // cleanup would otherwise tear the loop down after the very first message (the roll).
  useEffect(() => {
    const isOpponentTurn =
      gameState.status !== GameStatus.FINISHED &&
      gameState.turn.currentPlayerId !== gameState.viewerId &&
      (gameState.turn.phase === TurnPhase.PRE_ROLL || gameState.turn.phase === TurnPhase.JAIL_DECISION);
    if (!isOpponentTurn || opponentTurnRef.current) return;

    opponentTurnRef.current = true;
    void (async () => {
      while (mountedRef.current) {
        const game = useGameStore.getState().snapshot.game;
        if (game.status === GameStatus.FINISHED) break;
        if (game.turn.currentPlayerId === game.viewerId) break;
        if (game.turn.phase !== TurnPhase.PRE_ROLL && game.turn.phase !== TurnPhase.JAIL_DECISION) break;

        for (const msg of runOpponentTurn(game)) {
          if (!mountedRef.current) return;
          applyServerMessage(msg);
          await delay(750);
        }
        await delay(300);   // brief pause between consecutive opponent turns
      }
      opponentTurnRef.current = false;
    })();
  }, [gameState.turn.currentPlayerId, gameState.turn.phase, gameState.status, gameState.viewerId, applyServerMessage]);

  // An opponent who is the target of the viewer's pending trade auto-responds.
  useEffect(() => {
    const trade = gameState.trade;
    if (!trade || trade.status !== 'pending') return;
    if (trade.targetId === gameState.viewerId) return;   // human is the target → they decide
    const t = setTimeout(() => {
      for (const msg of opponentRespondToTrade(useGameStore.getState().snapshot.game)) {
        applyServerMessage(msg);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [gameState.trade, gameState.viewerId, applyServerMessage]);

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
    dispatch({ type: CommandType.ResolveCard });
  }, [dispatch]);

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

  // ── Jail decision ───────────────────────────────────────────────────────
  const handlePayJailFine = useCallback(() => dispatch({ type: CommandType.PayJailFine }), [dispatch]);
  const handleUseJailCard = useCallback(() => dispatch({ type: CommandType.UseJailCard }), [dispatch]);
  const handleRollInJail  = useCallback(() => dispatch({ type: CommandType.RollInJail }),  [dispatch]);

  // ── Property management ──────────────────────────────────────────────────
  const handleManage      = useCallback(() => setOpenedModal('manage'), [setOpenedModal]);
  const handleBuildHouse  = useCallback((position: number) => dispatch({ type: CommandType.BuildHouse, position }), [dispatch]);
  const handleBuildHotel  = useCallback((position: number) => dispatch({ type: CommandType.BuildHotel, position }), [dispatch]);
  const handleSellHouse   = useCallback((position: number) => dispatch({ type: CommandType.SellHouse, position }),  [dispatch]);
  const handleSellHotel   = useCallback((position: number) => dispatch({ type: CommandType.SellHotel, position }),  [dispatch]);
  const handleMortgage    = useCallback((position: number) => dispatch({ type: CommandType.Mortgage, position }),   [dispatch]);
  const handleUnmortgage  = useCallback((position: number) => dispatch({ type: CommandType.Unmortgage, position }), [dispatch]);
  const handleSellProperty = useCallback((position: number) => dispatch({ type: CommandType.SellProperty, position }), [dispatch]);

  // ── Debt resolution ──────────────────────────────────────────────────────
  const handlePayDebt           = useCallback(() => dispatch({ type: CommandType.PayDebt }), [dispatch]);
  const handleDeclareBankruptcy = useCallback(() => dispatch({ type: CommandType.DeclareBankruptcy }), [dispatch]);

  const handleTrade = useCallback(() => setOpenedModal('trade'), [setOpenedModal]);

  const handleProposeTrade = useCallback(
    (targetId: string, offer: TradeOffer, request: TradeOffer) => {
      setOpenedModal(null);
      dispatch({ type: CommandType.StartTrade, targetId, offer, request });
    },
    [dispatch, setOpenedModal],
  );

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

  const handleTradeCounter = useCallback(() => {
    // Mock counter: the target mirrors the deal back (gives what was requested,
    // requests what was offered). A real builder UI would let them edit the terms.
    const trade = useGameStore.getState().snapshot.game.trade;
    if (!trade) return;
    dispatch({
      type: CommandType.CounterTrade,
      tradeId: trade.id,
      offer:   trade.targetRequest,
      request: trade.proposerOffer,
    });
  }, [dispatch]);

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

  const jailDecision =
    gameState.turn.phase === TurnPhase.JAIL_DECISION &&
    gameState.turn.currentPlayerId === gameState.viewerId;

  const debtPending =
    gameState.turn.phase === TurnPhase.MUST_PAY_RENT &&
    gameState.debt?.debtorId === gameState.viewerId;
  const debtAmount = gameState.debt?.amount ?? 0;

  // Viewer's properties for the Manage modal.
  const manageProperties: ManageProperty[] = getPlayerProperties(gameState, gameState.viewerId).map((s) => {
    const color = BOARD[s.position]?.color;
    return {
      position:    s.position,
      name:        BOARD[s.position]?.name ?? `#${s.position}`,
      color,
      houses:      s.houses,
      hotel:       s.hotel,
      isMortgaged: s.isMortgaged,
      inMonopoly:  !!color && hasMonopoly(gameState, gameState.viewerId, color),
      rent:        getPropertyRent(gameState, s.position),
    };
  });
  const isViewerTurn = gameState.turn.currentPlayerId === gameState.viewerId;
  const canManage = isViewerTurn && manageProperties.length > 0 &&
    (gameState.turn.phase === TurnPhase.PRE_ROLL || gameState.turn.phase === TurnPhase.POST_ROLL);

  // Trade-builder data.
  const propertiesOf = (playerId: string): TradeAsset[] =>
    getPlayerProperties(gameState, playerId)
      .filter((s) => s.houses === 0 && !s.hotel)   // can't trade a property with buildings
      .map((s) => ({ position: s.position, name: BOARD[s.position]?.name ?? `#${s.position}`, color: BOARD[s.position]?.color }));
  const jailCardsOf = (playerId: string): number =>
    gameState.players.find((p) => p.id === playerId)?.getOutOfJailCards ?? 0;
  const tradeOthers = gameState.players
    .filter((p) => p.id !== gameState.viewerId && !p.isBankrupt)
    .map((p) => ({ id: p.id, name: p.displayName, balance: p.balance }));

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
              canManage={canManage}
              canTrade={permissions.canTrade}
              onRoll={handleRoll}
              onSendMessage={handleSendMessage}
              onManage={handleManage}
              onTrade={handleTrade}
              activeCard={gameState.activeCard}
              onCardProceed={handleCardProceed}
              activeDeed={activeDeed}
              onBuy={handleBuy}
              onAuction={handleAuction}
              jailDecision={jailDecision}
              jailAttempts={viewer?.jailStatus?.attempts ?? 0}
              canPayJailFine={permissions.canPayJailFine}
              canUseJailCard={permissions.canUseJailCard}
              canRollInJail={permissions.canRollInJail}
              onPayJailFine={handlePayJailFine}
              onUseJailCard={handleUseJailCard}
              onRollInJail={handleRollInJail}
              debtPending={debtPending}
              debtAmount={debtAmount}
              canPayDebt={permissions.canPayDebt}
              onPayDebt={handlePayDebt}
              onManageDebt={handleManage}
              onDeclareBankruptcy={handleDeclareBankruptcy}
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
              onTradeCounter={handleTradeCounter}
              onTradeCancel={handleTradeCancel}
            />
          }
        />
      </div>
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
        <PlayerSidebar players={deriveSidebarPlayers(gameState)} />
      </aside>

      {/* Property management modal */}
      {openedModal === 'manage' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/40" onClick={() => setOpenedModal(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ManagePropertiesModal
              properties={manageProperties}
              canBuildHouse={permissions.canBuildHouse}
              canBuildHotel={permissions.canBuildHotel}
              canMortgage={permissions.canMortgage}
              canUnmortgage={permissions.canUnmortgage}
              onBuildHouse={handleBuildHouse}
              onBuildHotel={handleBuildHotel}
              onSellHouse={handleSellHouse}
              onSellHotel={handleSellHotel}
              onMortgage={handleMortgage}
              onUnmortgage={handleUnmortgage}
              onSellProperty={permissions.canSellProperty ? handleSellProperty : undefined}
              onClose={() => setOpenedModal(null)}
            />
          </div>
        </div>
      )}

      {/* Trade builder modal */}
      {openedModal === 'trade' && tradeOthers.length > 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/40" onClick={() => setOpenedModal(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <TradeBuilder
              me={{ id: gameState.viewerId, name: viewer?.displayName ?? 'You', balance: viewer?.balance ?? 0 }}
              others={tradeOthers}
              myProperties={propertiesOf(gameState.viewerId)}
              myJailCards={jailCardsOf(gameState.viewerId)}
              propertiesOf={propertiesOf}
              jailCardsOf={jailCardsOf}
              onPropose={handleProposeTrade}
              onClose={() => setOpenedModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
