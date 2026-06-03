'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BoardContainer,
  deriveBoardPlayers,
  deriveSidebarPlayers,
} from '@/features/game-board';
import { getSession, joinByCode, leaveSession, startGame } from '@/features/lobby/api';
import { SessionStatus } from '@/features/lobby';
import type { ManageProperty } from '@/features/manage';
import type { TradeAsset, TradePlayer } from '@/features/trade/components/TradeBuilder';
import type { TradeParticipant } from '@/features/trade/trade.types';
import { BOARD } from '@/shared/config/board-layout';
import { TOKEN_COLORS, TOKEN_ORDER } from '@/shared/config/constants';
import { useBoardSfx } from '@/shared/hooks/useBoardSfx';
import { useOnWsError } from '@/shared/hooks/useOnWsError';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import {
  getPlayerProperties,
  getPropertyRent,
  getViewerPlayer,
  hasMonopoly,
} from '@/shared/protocol/selectors';
import { GameStatus, TradeStatus, TurnPhase } from '@/shared/protocol/game-state.enums';
import type { GameState, PlayerState, TradeOffer } from '@/shared/protocol/game-state';
import { CommandType } from '@/shared/protocol/commands';
import { useGameSocket } from '@/shared/socket';
import { resolveAnimationGate } from '@/shared/socket/timeline-executor';
import { Button } from '@/shared/ui/Button';
import { FullScreenSpinner, Spinner } from '@/shared/ui/Spinner';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import { useGameStore } from '@/stores/game-store';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';
import { useUiStore } from '@/stores/ui-store';
import { useGameDispatch } from './useGameDispatch';
import type { ActiveOverlay, TradeBuilderData } from './_components/FullOverlay';
import { GameCenterGrid } from './_components/GameCenterGrid';
import { WaitingCenterGrid } from './_components/WaitingCenterGrid';

const SESSION_RESTORE_TIMEOUT_MS = 5_000;
const ROOM_BOOT_TIMEOUT_MS = 7_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function toTradeParticipant(game: GameState, player: PlayerState): TradeParticipant {
  return {
    id: player.id,
    name: player.displayName,
    token: player.token,
    balance: player.balance,
    ownedPositions: getPlayerProperties(game, player.id).map((space) => space.position),
  };
}

function toTradePlayer(player: PlayerState): TradePlayer {
  return { id: player.id, name: player.displayName, balance: player.balance };
}

function toTradeAsset(game: GameState, position: number): TradeAsset {
  const boardSpace = BOARD[position];
  return { position, name: boardSpace?.name ?? `Space ${position}`, color: boardSpace?.color };
}

function getManageProperties(game: GameState, viewerPlayerId: string | null): ManageProperty[] {
  if (!viewerPlayerId) return [];
  return getPlayerProperties(game, viewerPlayerId).map((space) => {
    const boardSpace = BOARD[space.position];
    const color = boardSpace?.color;
    return {
      position: space.position,
      name: boardSpace?.name ?? `Space ${space.position}`,
      color,
      houses: space.houses,
      hotel: space.hotel,
      isMortgaged: space.isMortgaged,
      inMonopoly: color ? hasMonopoly(game, viewerPlayerId, color) : false,
      rent: getPropertyRent(game, space.position),
    };
  });
}

function EmptyGameState({ sessionCode, status }: { sessionCode: string | null; status: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[18px] border border-line bg-surface px-5 text-center">
      <Spinner size="lg" />
      <div>
        <p className="font-display text-lg font-semibold text-ink">Loading game state</p>
        <p className="mt-1 text-sm text-muted">
          {sessionCode ? `Room ${sessionCode}` : 'Room'} is connected as {status}.
        </p>
      </div>
    </div>
  );
}

function FinishedGameState({
  winnerName,
  onLeave,
  isLeaving,
}: {
  winnerName: string | null;
  onLeave: () => void;
  isLeaving: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 rounded-[18px] border border-line bg-surface px-5 text-center">
      <div>
        <p className="font-display text-lg font-semibold text-ink">Game finished</p>
        <p className="mt-1 text-sm text-muted">
          {winnerName ? `${winnerName} won the game.` : 'This game has ended.'}
        </p>
      </div>
      <Button onClick={onLeave} variant="blue" disabled={isLeaving}>
        {isLeaving ? 'Leaving…' : 'Back to lobby'}
      </Button>
    </div>
  );
}

function NoActiveRoomState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <section className="w-full max-w-md rounded-[12px] border border-line bg-surface p-5 text-center">
        <h1 className="font-display text-xl font-bold text-ink">No active room</h1>
        <p className="mt-2 text-sm text-muted">
          Join or create a room from the lobby to continue.
        </p>
        <Button as="a" href="/lobby" variant="blue" className="mt-4">
          Back to lobby
        </Button>
      </section>
    </main>
  );
}

export default function GameRoomPage() {
  const router = useRouter();
  const { ready, user } = useRequireAuth();
  const { dispatch } = useGameDispatch();

  const currentSession = useSessionStore((state) => state.currentSession);
  const sessionHydrated = useSessionStore((state) => state._hasHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const snapshot = useGameStore((state) => state.snapshot);
  const game = snapshot.game;
  const permissions = snapshot.permissions;
  const resetGame = useGameStore((state) => state.reset);

  const status = useSocketStore((state) => state.status);
  const wsError = useSocketStore((state) => state.wsError);
  const wasKicked = useSocketStore((state) => state.wasKicked);
  const socketMessages = useSocketStore((state) => state.messages);
  const clearWsError = useSocketStore((state) => state.clearWsError);
  const resetSocket = useSocketStore((state) => state.reset);

  const isRolling = useUiStore((state) => state.isRolling);
  const isTimelineRunning = useUiStore((state) => state.isTimelineRunning);
  const walkState = useUiStore((state) => state.walkState);
  const animatedDiceRoll = useUiStore((state) => state.animatedDiceRoll);
  const animatedDiceRollId = useUiStore((state) => state.animatedDiceRollId);
  const activeAnimationCard = useUiStore((state) => state.activeAnimationCard);
  const pendingAnimationInteraction = useUiStore((state) => state.pendingAnimationInteraction);
  const selectedTile = useUiStore((state) => state.selectedTile);
  const setSelectedTile = useUiStore((state) => state.setSelectedTile);

  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const [validatedSessionId, setValidatedSessionId] = useState<string | null>(null);
  const [sessionRestoreFailed, setSessionRestoreFailed] = useState(false);
  const [roomBootTimedOut, setRoomBootTimedOut] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);

  const sessionId = currentSession?.id ?? null;
  const canConnectSocket = Boolean(ready && sessionId && validatedSessionId === sessionId);
  const { sendChat, sendSticker } = useGameSocket(canConnectSocket ? sessionId : null);
  const isScreenShaking = useOnWsError(wsError);

  useBoardSfx(game);

  // ─── Boot timeout ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (ready && sessionHydrated && !isJoiningByCode && !isValidatingSession) {
      setRoomBootTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setRoomBootTimedOut(true), ROOM_BOOT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isJoiningByCode, isValidatingSession, ready, sessionHydrated]);

  // ─── Join by invite code ───────────────────────────────────────────────────

  useEffect(() => {
    if (!ready || !sessionHydrated || currentSession || isJoiningByCode) return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    setIsJoiningByCode(true);
    joinByCode({ invite_code: code })
      .then(({ session }) => { resetSocket(); setSession(session); setJoinError(null); router.replace('/game/room'); })
      .catch((error) => setJoinError((error as Error).message))
      .finally(() => setIsJoiningByCode(false));
  }, [currentSession, isJoiningByCode, ready, router, sessionHydrated, setSession]);

  // ─── Session validation ────────────────────────────────────────────────────

  useEffect(() => {
    if (!ready || !sessionHydrated || isJoiningByCode) return;

    const sessionIdToValidate = currentSession?.id;
    if (!sessionIdToValidate) {
      setValidatedSessionId(null);
      setSessionRestoreFailed(false);
      return;
    }
    if (validatedSessionId === sessionIdToValidate) return;

    let cancelled = false;
    setIsValidatingSession(true);
    setSessionRestoreFailed(false);

    withTimeout(getSession(sessionIdToValidate), SESSION_RESTORE_TIMEOUT_MS, 'Could not restore the room session.')
      .then(({ session }) => {
        if (cancelled) return;
        setSession(session);
        setValidatedSessionId(session.id);
        setSessionRestoreFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setValidatedSessionId(null);
        setSessionRestoreFailed(true);
        clearSession();
        resetSocket();
        resetGame();
        router.replace('/lobby');
      })
      .finally(() => {
        // Always clear — even if cancelled. React may flush cleanup between .then/.finally,
        // causing cancelled=true even on success. The re-run takes the early return and
        // never clears isValidatingSession, hanging the boot.
        setIsValidatingSession(false);
      });

    return () => { cancelled = true; };
  }, [
    clearSession, currentSession?.id, isJoiningByCode, ready,
    resetGame, resetSocket, router, sessionHydrated, setSession, validatedSessionId,
  ]);

  // ─── Kick handling ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!wasKicked) return;
    clearSession();
    resetSocket();
    router.replace('/lobby?kicked=1');
  }, [clearSession, resetSocket, router, wasKicked]);

  // ─── Derived values ────────────────────────────────────────────────────────

  const viewerPlayer = useMemo(() => getViewerPlayer(game, user?.id), [game, user?.id]);
  const viewerPlayerId = viewerPlayer?.id ?? (game.viewerId || null);

  const boardPlayers = useMemo(() => deriveBoardPlayers(game), [game]);
  const sidebarPlayers = useMemo(() => deriveSidebarPlayers(game), [game]);

  const waitingSidebarPlayers = useMemo(
    () => currentSession?.members.map((m, i) => ({
      id: m.user_id,
      name: m.display_name,
      balance: 0,
      position: 0,
      token: TOKEN_ORDER[i % TOKEN_ORDER.length],
      ownedPositions: [] as number[],
      isActive: false,
      isBankrupt: false,
      inJail: false,
    })) ?? [],
    [currentSession?.members],
  );

  const walkingPlayers = useMemo(() => {
    if (!walkState) return [];
    const player = game.players.find((p) => p.id === walkState.playerId);
    return [{
      id: walkState.playerId,
      currentPos: walkState.currentPos,
      tokenColor: player ? TOKEN_COLORS[player.token] : '#10182E',
      fast: walkState.fast,
    }];
  }, [game.players, walkState]);

  const manageProperties = useMemo(
    () => getManageProperties(game, viewerPlayerId),
    [game, viewerPlayerId],
  );

  const tradeParticipants = useMemo(() => {
    const proposer = game.trade ? game.players.find((p) => p.id === game.trade?.proposerId) : null;
    const target   = game.trade ? game.players.find((p) => p.id === game.trade?.targetId)   : null;
    return {
      proposer: proposer ? toTradeParticipant(game, proposer) : null,
      target:   target   ? toTradeParticipant(game, target)   : null,
    };
  }, [game]);

  const tradeBuilderData = useMemo((): TradeBuilderData | null => {
    if (!viewerPlayer) return null;
    const others = game.players
      .filter((p) => p.id !== viewerPlayer.id && !p.isBankrupt)
      .map(toTradePlayer);
    return {
      me: toTradePlayer(viewerPlayer),
      others,
      myProperties: getPlayerProperties(game, viewerPlayer.id).map((space) => toTradeAsset(game, space.position)),
      myJailCards: viewerPlayer.getOutOfJailCards,
      propertiesOf: (playerId) => getPlayerProperties(game, playerId).map((space) => toTradeAsset(game, space.position)),
      jailCardsOf: (playerId) => game.players.find((p) => p.id === playerId)?.getOutOfJailCards ?? 0,
    };
  }, [game, viewerPlayer]);

  const tokenByUserId = useMemo(
    () => new Map(game.players.map((p) => [p.userId, p.token])),
    [game.players],
  );

  const lobbyMessages = useMemo(
    () => socketMessages.map((m) => ({
      id: m.id,
      kind: 'chat' as const,
      author: m.display_name,
      text: m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
      ts: Date.parse(m.ts),
    })),
    [socketMessages],
  );

  const gameChatMessages = useMemo(
    () => socketMessages.map((m) => ({
      id: m.id,
      kind: 'chat' as const,
      author: m.from_user_id === user?.id ? 'You' : m.display_name,
      token: tokenByUserId.get(m.from_user_id),
      text: m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
      ts: Date.parse(m.ts),
    })),
    [socketMessages, tokenByUserId, user?.id],
  );

  const diceRoll = animatedDiceRoll ?? game.turn.diceRoll;
  const activeCard = activeAnimationCard ?? game.activeCard;
  const pendingBuyPosition = game.turn.pendingBuyPosition;
  const pendingBuySpace = pendingBuyPosition != null ? (BOARD[pendingBuyPosition] ?? null) : null;
  const isViewerTurn = Boolean(viewerPlayerId && game.turn.currentPlayerId === viewerPlayerId);
  const isBuyDecisionForViewer = Boolean(pendingBuySpace && isViewerTurn);
  const selectedBoardPosition = selectedTile != null && BOARD[selectedTile] ? selectedTile : null;
  const deedBrowsePosition = selectedBoardPosition ?? pendingBuyPosition ?? viewerPlayer?.position ?? 0;
  const deedBrowseSpace = BOARD[deedBrowsePosition] ?? BOARD[0];
  const highlightedBoardPosition = isBuyDecisionForViewer ? pendingBuyPosition : deedBrowsePosition;
  const deedPanelSpace = isBuyDecisionForViewer && pendingBuySpace ? pendingBuySpace : deedBrowseSpace;
  const canRoll = (permissions.canRoll || permissions.canRollInJail) && !isRolling && !isTimelineRunning;
  const canManagePendingBuyShortfall = Boolean(
    pendingBuySpace &&
    isViewerTurn &&
    manageProperties.length > 0 &&
    viewerPlayer &&
    pendingBuySpace.price != null &&
    viewerPlayer.balance < pendingBuySpace.price,
  );
  const canManage =
    permissions.canBuildHouse ||
    permissions.canBuildHotel ||
    permissions.canMortgage ||
    permissions.canUnmortgage ||
    manageProperties.length > 0 ||
    canManagePendingBuyShortfall;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const dispatchCommand = useCallback((type: CommandType, payload: Record<string, unknown> = {}) => {
    dispatch({ type, ...payload } as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  const handleRoll = useCallback(() => {
    dispatch({ type: permissions.canRollInJail ? CommandType.RollInJail : CommandType.RollDice });
  }, [dispatch, permissions.canRollInJail]);

  const handleBuy = useCallback(() => {
    if (!permissions.canBuyProperty || pendingBuyPosition == null) return;
    dispatch({ type: CommandType.BuyProperty, position: pendingBuyPosition });
  }, [dispatch, pendingBuyPosition, permissions.canBuyProperty]);

  const handlePassBuy = useCallback(() => {
    if (!permissions.canBuyProperty) return;
    dispatch({ type: CommandType.PassBuy });
  }, [dispatch, permissions.canBuyProperty]);

  const handleSelectBoardPosition = useCallback((position: number) => {
    setSelectedTile(position);
  }, [setSelectedTile]);

  const handleStartGame = useCallback(async () => {
    if (!sessionId || isStarting) return;
    setIsStarting(true);
    try { await startGame(sessionId); } finally { setIsStarting(false); }
  }, [isStarting, sessionId]);

  const handleLeaveRoom = useCallback(async () => {
    if (!sessionId || isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveSession(sessionId);
      clearSession();
      resetSocket();
      router.replace('/lobby');
    } finally {
      setIsLeaving(false);
    }
  }, [clearSession, isLeaving, resetSocket, router, sessionId]);

  const handleTradePropose = useCallback((targetId: string, offer: TradeOffer, request: TradeOffer) => {
    dispatch({ type: CommandType.StartTrade, targetId, offer, request });
    setActiveOverlay(null);
  }, [dispatch]);

  const handleCardProceed = useCallback(() => {
    const pending = useUiStore.getState().pendingAnimationInteraction;
    if (pending) {
      dispatch({ type: CommandType.AnimationContinue, interactionId: pending.interactionId });
      resolveAnimationGate(pending.interactionId);
      return;
    }
    dispatch({ type: CommandType.ResolveCard });
  }, [dispatch]);

  // ─── Boot guards ──────────────────────────────────────────────────────────

  if (
    !roomBootTimedOut &&
    (!ready || !sessionHydrated || isJoiningByCode || isValidatingSession ||
      (currentSession && validatedSessionId !== currentSession.id && !sessionRestoreFailed))
  ) {
    return <FullScreenSpinner />;
  }

  if (roomBootTimedOut && (!ready || !sessionHydrated || isJoiningByCode || isValidatingSession)) {
    return <NoActiveRoomState />;
  }

  if (joinError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <section className="w-full max-w-md rounded-[12px] border border-red/30 bg-surface p-5 text-center">
          <h1 className="font-display text-xl font-bold text-ink">Could not join room</h1>
          <p className="mt-2 text-sm text-red">{joinError}</p>
          <Button as="a" href="/lobby" variant="blue" className="mt-4">Back to lobby</Button>
        </section>
      </main>
    );
  }

  if (!currentSession) return <NoActiveRoomState />;
  if (validatedSessionId !== currentSession.id) return <NoActiveRoomState />;

  const isWaitingSession =
    currentSession.status === SessionStatus.WAITING ||
    (game.status === GameStatus.LOBBY && game.players.length === 0);
  const isFinishedSession =
    currentSession.status === SessionStatus.FINISHED ||
    game.status === GameStatus.FINISHED;
  const winnerName = game.winnerId
    ? game.players.find((player) => player.id === game.winnerId)?.displayName ?? null
    : null;

  useEffect(() => {
    if (!isFinishedSession) return;
    useGameStore.persist.clearStorage();
  }, [isFinishedSession]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className={`relative h-screen min-h-0 w-full overflow-hidden bg-paper${isScreenShaking ? ' ws-error-screen-shake' : ''}`}>
      <WsErrorBanner error={wsError} onDismiss={clearWsError} />

      {isWaitingSession ? (
        <div className="h-full min-h-0 p-[4px]">
          <BoardContainer
            centerContent={(
              <WaitingCenterGrid
                inviteCode={currentSession.invite_code}
                memberCount={currentSession.member_count}
                maxPlayers={currentSession.max_players}
                yourRole={currentSession.your_role}
                messages={lobbyMessages}
                onSendMessage={sendChat}
                onSendSticker={sendSticker}
                onLeave={handleLeaveRoom}
                onStart={handleStartGame}
                isLeaving={isLeaving}
                isStarting={isStarting}
              />
            )}
            sidebarPlayers={waitingSidebarPlayers}
          />
        </div>
      ) : isFinishedSession ? (
        <div className="h-full min-h-0 p-[4px]">
          <BoardContainer
            centerContent={(
              <FinishedGameState
                winnerName={winnerName}
                onLeave={handleLeaveRoom}
                isLeaving={isLeaving}
              />
            )}
            spaces={game.spaces}
            players={boardPlayers}
            sidebarPlayers={sidebarPlayers}
            viewerId={viewerPlayerId ?? undefined}
            createdAt={game.createdAt}
            onSurrender={() => dispatchCommand(CommandType.Surrender)}
          />
        </div>
      ) : game.players.length === 0 ? (
        <div className="h-full min-h-0 p-[4px]">
          <BoardContainer
            centerContent={(
              <EmptyGameState
                sessionCode={currentSession.invite_code}
                status={status}
              />
            )}
          />
        </div>
      ) : (
        <BoardContainer
          centerContent={(
            <GameCenterGrid
              // Layout
              isBuyDecisionForViewer={isBuyDecisionForViewer}
              animatedDiceRollId={animatedDiceRollId}
              deedPanelSpace={deedPanelSpace}
              pendingBuySpace={pendingBuySpace}
              // Button states
              canRoll={canRoll}
              canBuyProperty={permissions.canBuyProperty}
              canManage={canManage}
              canEndTurn={permissions.canEndTurn}
              canTrade={permissions.canTrade}
              hasOtherTraders={Boolean(tradeBuilderData?.others.length)}
              isRolling={isRolling}
              isViewerTurn={isViewerTurn}
              roundNumber={game.turn.roundNumber}
              // Button handlers
              onRoll={handleRoll}
              onEndTurn={() => dispatchCommand(CommandType.EndTurn)}
              onManageOpen={() => setActiveOverlay('manage')}
              onTradeOpen={() => setActiveOverlay('trade-builder')}
              onBuy={handleBuy}
              onAuction={handlePassBuy}
              // CenterPanel props
              activeCard={activeCard}
              pendingInteractionPlayerId={pendingAnimationInteraction?.affectedPlayerId ?? null}
              viewerPlayerId={viewerPlayerId}
              debt={game.debt}
              auction={game.auction}
              auctionPlayers={game.players.map((p) => ({ id: p.id, name: p.displayName }))}
              turnPhase={game.turn.phase}
              jailStatus={viewerPlayer?.jailStatus ?? null}
              diceRoll={diceRoll}
              canPayDebt={permissions.canPayDebt}
              canBidAuction={permissions.canBidAuction}
              canRollInJail={permissions.canRollInJail}
              canPayJailFine={permissions.canPayJailFine}
              canUseJailCard={permissions.canUseJailCard}
              log={game.log}
              chatMessages={gameChatMessages}
              viewerToken={viewerPlayer?.token}
              onCardProceed={handleCardProceed}
              onPayDebt={() => dispatchCommand(CommandType.PayDebt)}
              onManage={() => setActiveOverlay('manage')}
              onBankrupt={() => dispatchCommand(CommandType.DeclareBankruptcy)}
              onBidAuction={(amount) => dispatch({ type: CommandType.BidAuction, amount })}
              onPayJailFine={() => dispatchCommand(CommandType.PayJailFine)}
              onUseJailCard={() => dispatchCommand(CommandType.UseJailCard)}
              onSendMessage={sendChat}
              onSendSticker={sendSticker}
              // FullOverlay props
              trade={game.trade}
              tradeProposer={tradeParticipants.proposer}
              tradeTarget={tradeParticipants.target}
              activeOverlay={activeOverlay}
              manageProperties={manageProperties}
              canBuildHouse={permissions.canBuildHouse}
              canBuildHotel={permissions.canBuildHotel}
              canMortgage={permissions.canMortgage}
              canUnmortgage={permissions.canUnmortgage}
              tradeBuilderData={tradeBuilderData}
              onTradeAccept={() => dispatch({ type: CommandType.AcceptTrade, tradeId: game.trade!.id })}
              onTradeReject={() => dispatch({ type: CommandType.RejectTrade, tradeId: game.trade!.id })}
              onTradeCancel={() => dispatch({ type: CommandType.RejectTrade, tradeId: game.trade!.id })}
              onBuildHouse={(position) => dispatch({ type: CommandType.BuildHouse, position })}
              onBuildHotel={(position) => dispatch({ type: CommandType.BuildHotel, position })}
              onSellHouse={(position) => dispatch({ type: CommandType.SellHouse, position })}
              onSellHotel={(position) => dispatch({ type: CommandType.SellHotel, position })}
              onMortgage={(position) => dispatch({ type: CommandType.Mortgage, position })}
              onUnmortgage={(position) => dispatch({ type: CommandType.Unmortgage, position })}
              onSellProperty={(position) => dispatch({ type: CommandType.SellProperty, position })}
              onCloseOverlay={() => setActiveOverlay(null)}
              onTradePropose={handleTradePropose}
            />
          )}
          spaces={game.spaces}
          players={boardPlayers}
          walkingPlayers={walkingPlayers}
          sidebarPlayers={sidebarPlayers}
          selectedPosition={highlightedBoardPosition}
          onSelectPosition={handleSelectBoardPosition}
          focusPosition={isBuyDecisionForViewer ? pendingBuyPosition : null}
          viewerId={viewerPlayerId ?? undefined}
          createdAt={game.createdAt}
          onSurrender={() => dispatchCommand(CommandType.Surrender)}
        />
      )}
    </main>
  );
}
