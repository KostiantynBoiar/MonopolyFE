'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuctionOverlay } from '@/features/auction';
import { DebtOverlay } from '@/features/bankruptcy';
import { CardFlipOverlay } from '@/features/card';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { DeedWindow } from '@/features/deed';
import { DiceWindow } from '@/features/dice';
import {
  BoardContainer,
  BOARD_TILE_COLORS,
  deriveBoardPlayers,
  deriveSidebarPlayers,
  GAME_BOARD_COLORS,
} from '@/features/game-board';
import type { OverlayId } from '@/features/game-board';
import { JailOverlay } from '@/features/jail';
import {
  getSession,
  joinByCode,
  leaveSession,
  startGame,
} from '@/features/lobby/api';
import { SessionStatus } from '@/features/lobby';
import { WaitingCenterPanel } from '@/features/lobby/components/WaitingCenterPanel';
import { ManagePropertiesOverlay, type ManageProperty } from '@/features/manage';
import { TradeBuilder, type TradeAsset, type TradePlayer } from '@/features/trade/components/TradeBuilder';
import { TradeOverlay } from '@/features/trade/components/TradeOverlay';
import { BOARD } from '@/shared/config/board-layout';
import { TOKEN_COLORS, TOKEN_ORDER } from '@/shared/config/constants';
import { useBoardSfx } from '@/shared/hooks/useBoardSfx';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { getPropertyRent, getPlayerProperties, getViewerPlayer, hasMonopoly } from '@/shared/protocol/selectors';
import { AuctionTargetKind, GameStatus, TradeStatus, TurnPhase } from '@/shared/protocol/game-state.enums';
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

type CenterOverlay = OverlayId | 'trade-builder' | null;

const SESSION_RESTORE_TIMEOUT_MS = 5_000;
const ROOM_BOOT_TIMEOUT_MS = 7_000;

function getBoardSpaceName(position: number) {
  return BOARD[position]?.name ?? `Space ${position}`;
}

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

function toTradeParticipant(game: GameState, player: PlayerState) {
  return {
    id: player.id,
    name: player.displayName,
    token: player.token,
    balance: player.balance,
    ownedPositions: getPlayerProperties(game, player.id).map((space) => space.position),
  };
}

function toTradePlayer(player: PlayerState): TradePlayer {
  return {
    id: player.id,
    name: player.displayName,
    balance: player.balance,
  };
}

function toTradeAsset(game: GameState, position: number): TradeAsset {
  const boardSpace = BOARD[position];

  return {
    position,
    name: boardSpace?.name ?? `Space ${position}`,
    color: boardSpace?.color,
  };
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
  const walkState = useUiStore((state) => state.walkState);
  const animatedDiceRoll = useUiStore((state) => state.animatedDiceRoll);
  const animatedDiceRollId = useUiStore((state) => state.animatedDiceRollId);
  const activeAnimationCard = useUiStore((state) => state.activeAnimationCard);
  const setPendingAnimationInteraction = useUiStore((state) => state.setPendingAnimationInteraction);
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
  const [centerOverlay, setCenterOverlay] = useState<CenterOverlay>(null);

  const sessionId = currentSession?.id ?? null;
  const canConnectSocket = Boolean(ready && sessionId && validatedSessionId === sessionId);
  const { sendChat, sendSticker } = useGameSocket(canConnectSocket ? sessionId : null);

  useBoardSfx(game);

  useEffect(() => {
    if (ready && sessionHydrated && !isJoiningByCode && !isValidatingSession) {
      setRoomBootTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setRoomBootTimedOut(true);
    }, ROOM_BOOT_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isJoiningByCode, isValidatingSession, ready, sessionHydrated]);

  useEffect(() => {
    if (!ready || !sessionHydrated || currentSession || isJoiningByCode) return;

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      return;
    }

    setIsJoiningByCode(true);
    joinByCode({ invite_code: code })
      .then(({ session }) => {
        setSession(session);
        setJoinError(null);
        router.replace('/game/room');
      })
      .catch((error) => setJoinError((error as Error).message))
      .finally(() => setIsJoiningByCode(false));
  }, [currentSession, isJoiningByCode, ready, router, sessionHydrated, setSession]);

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

    withTimeout(
      getSession(sessionIdToValidate),
      SESSION_RESTORE_TIMEOUT_MS,
      'Could not restore the room session.',
    )
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
        // Always clear the loading state — even if this run was cancelled.
        // React may flush the re-render (and run the effect cleanup) synchronously
        // between .then and .finally, causing cancelled=true here even though the
        // request completed successfully. The re-run takes the "already validated"
        // early return and never clears isValidatingSession, hanging the boot.
        setIsValidatingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    clearSession,
    currentSession?.id,
    isJoiningByCode,
    ready,
    resetGame,
    resetSocket,
    router,
    sessionHydrated,
    setSession,
    validatedSessionId,
  ]);

  useEffect(() => {
    if (!wasKicked) return;
    clearSession();
    resetSocket();
    router.replace('/lobby?kicked=1');
  }, [clearSession, resetSocket, router, wasKicked]);

  const viewerPlayer = useMemo(() => getViewerPlayer(game, user?.id), [game, user?.id]);
  const viewerPlayerId = viewerPlayer?.id ?? (game.viewerId || null);

  const boardPlayers = useMemo(() => deriveBoardPlayers(game), [game]);
  const sidebarPlayers = useMemo(() => deriveSidebarPlayers(game), [game]);
  const waitingSidebarPlayers = useMemo(
    () => currentSession?.members.map((m, i) => ({
      id:             m.user_id,
      name:           m.display_name,
      balance:        0,
      position:       0,
      token:          TOKEN_ORDER[i % TOKEN_ORDER.length],
      ownedPositions: [] as number[],
      isActive:       false,
      isBankrupt:     false,
      inJail:         false,
    })) ?? [],
    [currentSession?.members],
  );
  const walkingPlayers = useMemo(() => {
    if (!walkState) return [];

    const player = game.players.find((candidate) => candidate.id === walkState.playerId);
    return [
      {
        id: walkState.playerId,
        currentPos: walkState.currentPos,
        tokenColor: player ? TOKEN_COLORS[player.token] : '#10182E',
        fast: walkState.fast,
      },
    ];
  }, [game.players, walkState]);

  const manageProperties = useMemo(
    () => getManageProperties(game, viewerPlayerId),
    [game, viewerPlayerId],
  );

  const tradeParticipants = useMemo(() => {
    const proposer = game.trade
      ? game.players.find((player) => player.id === game.trade?.proposerId)
      : null;
    const target = game.trade
      ? game.players.find((player) => player.id === game.trade?.targetId)
      : null;

    return {
      proposer: proposer ? toTradeParticipant(game, proposer) : null,
      target: target ? toTradeParticipant(game, target) : null,
    };
  }, [game]);

  const tradeBuilderData = useMemo(() => {
    if (!viewerPlayer) return null;

    const others = game.players
      .filter((player) => player.id !== viewerPlayer.id && !player.isBankrupt)
      .map(toTradePlayer);

    return {
      me: toTradePlayer(viewerPlayer),
      others,
      myProperties: getPlayerProperties(game, viewerPlayer.id).map((space) => toTradeAsset(game, space.position)),
      myJailCards: viewerPlayer.getOutOfJailCards,
      propertiesOf: (playerId: string) =>
        getPlayerProperties(game, playerId).map((space) => toTradeAsset(game, space.position)),
      jailCardsOf: (playerId: string) =>
        game.players.find((player) => player.id === playerId)?.getOutOfJailCards ?? 0,
    };
  }, [game, viewerPlayer]);

  const lobbyMessages = useMemo(
    () =>
      socketMessages.map((message) => ({
        id: message.id,
        kind: 'chat' as const,
        author: message.display_name,
        text: message.kind === 'sticker' ? `[sticker:${message.sticker_url}]` : message.text,
        ts: Date.parse(message.ts),
      })),
    [socketMessages],
  );

  const tokenByUserId = useMemo(
    () => new Map(game.players.map((player) => [player.userId, player.token])),
    [game.players],
  );

  const gameChatMessages = useMemo(
    () =>
      socketMessages
        .map((message) => ({
          id: message.id,
          kind: 'chat' as const,
          author: message.from_user_id === user?.id ? 'You' : message.display_name,
          token: tokenByUserId.get(message.from_user_id),
          text: message.kind === 'sticker' ? `[sticker:${message.sticker_url}]` : message.text,
          ts: Date.parse(message.ts),
        })),
    [socketMessages, tokenByUserId, user?.id],
  );

  const diceRoll = animatedDiceRoll ?? game.turn.diceRoll;
  const activeCard = activeAnimationCard ?? game.activeCard;
  const pendingBuyPosition = game.turn.pendingBuyPosition;
  const pendingBuySpace = pendingBuyPosition != null ? (BOARD[pendingBuyPosition] ?? null) : null;
  const isViewerTurn = Boolean(viewerPlayerId && game.turn.currentPlayerId === viewerPlayerId);
  const isBuyDecisionForViewer = Boolean(pendingBuySpace && isViewerTurn && permissions.canBuyProperty);
  const selectedBoardPosition = selectedTile != null && BOARD[selectedTile] ? selectedTile : null;
  const deedBrowsePosition = selectedBoardPosition ?? pendingBuyPosition ?? viewerPlayer?.position ?? 0;
  const deedBrowseSpace = BOARD[deedBrowsePosition] ?? BOARD[0];
  const highlightedBoardPosition = isBuyDecisionForViewer
    ? pendingBuyPosition
    : deedBrowsePosition;
  const deedPanelSpace = isBuyDecisionForViewer && pendingBuySpace
    ? pendingBuySpace
    : deedBrowseSpace;
  const canRoll = (permissions.canRoll || permissions.canRollInJail) && !isRolling;
  const canManage =
    permissions.canBuildHouse ||
    permissions.canBuildHotel ||
    permissions.canMortgage ||
    permissions.canUnmortgage ||
    manageProperties.length > 0;

  const dispatchCommand = useCallback((type: CommandType, payload: Record<string, unknown> = {}) => {
    dispatch({ type, ...payload } as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  const handleRoll = useCallback(() => {
    dispatch({
      type: permissions.canRollInJail ? CommandType.RollInJail : CommandType.RollDice,
    });
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
    try {
      await startGame(sessionId);
    } finally {
      setIsStarting(false);
    }
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
    dispatch({
      type: CommandType.StartTrade,
      targetId,
      offer,
      request,
    });
    setCenterOverlay(null);
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

  function renderCenterPanel() {
    if (activeCard) {
      return (
        <CardFlipOverlay
          card={activeCard}
          onProceed={handleCardProceed}
          canProceed={useUiStore.getState().pendingInteractionId !== null}
        />
      );
    }

    if (game.debt && game.debt.debtorId === viewerPlayerId) {
      return (
        <DebtOverlay
          amount={game.debt.amount}
          canPay={permissions.canPayDebt}
          onPay={() => dispatchCommand(CommandType.PayDebt)}
          onManage={() => setCenterOverlay('manage')}
          onBankrupt={() => dispatchCommand(CommandType.DeclareBankruptcy)}
        />
      );
    }

    if (game.auction) {
      const propertyName =
        game.auction.target.kind === AuctionTargetKind.PROPERTY
          ? getBoardSpaceName(game.auction.target.position)
          : game.auction.target.kind;

      return (
        <AuctionOverlay
          auctionState={game.auction}
          propertyName={propertyName}
          viewerId={viewerPlayerId ?? ''}
          players={game.players.map((player) => ({ id: player.id, name: player.displayName }))}
          canBid={permissions.canBidAuction}
          onBid={(amount) => dispatch({ type: CommandType.BidAuction, amount })}
        />
      );
    }

    if (game.turn.phase === TurnPhase.JAIL_DECISION && viewerPlayer?.jailStatus) {
      return (
        <JailOverlay
          attempts={viewerPlayer.jailStatus.attempts}
          canPayFine={permissions.canPayJailFine}
          canUseCard={permissions.canUseJailCard}
          canRoll={permissions.canRollInJail && !isRolling}
          diceRoll={diceRoll}
          isRolling={isRolling}
          onPayFine={() => dispatchCommand(CommandType.PayJailFine)}
          onUseCard={() => dispatchCommand(CommandType.UseJailCard)}
          onRoll={handleRoll}
        />
      );
    }

    return (
      <ChatWindow
        log={game.log}
        externalMessages={gameChatMessages}
        viewerToken={viewerPlayer?.token}
        onSendMessage={sendChat}
        onSendSticker={sendSticker}
      />
    );
  }

  function renderFullCenterOverlay() {
    if (
      game.trade &&
      game.trade.status === TradeStatus.PENDING &&
      tradeParticipants.proposer &&
      tradeParticipants.target
    ) {
      return (
        <TradeOverlay
          trade={game.trade}
          proposer={tradeParticipants.proposer}
          target={tradeParticipants.target}
          viewerId={viewerPlayerId ?? ''}
          onAccept={() => dispatch({ type: CommandType.AcceptTrade, tradeId: game.trade!.id })}
          onReject={() => dispatch({ type: CommandType.RejectTrade, tradeId: game.trade!.id })}
          onCancel={() => dispatch({ type: CommandType.RejectTrade, tradeId: game.trade!.id })}
        />
      );
    }

    if (centerOverlay === 'manage') {
      return (
        <ManagePropertiesOverlay
          properties={manageProperties}
          canBuildHouse={permissions.canBuildHouse}
          canBuildHotel={permissions.canBuildHotel}
          canMortgage={permissions.canMortgage}
          canUnmortgage={permissions.canUnmortgage}
          onBuildHouse={(position) => dispatch({ type: CommandType.BuildHouse, position })}
          onBuildHotel={(position) => dispatch({ type: CommandType.BuildHotel, position })}
          onSellHouse={(position) => dispatch({ type: CommandType.SellHouse, position })}
          onSellHotel={(position) => dispatch({ type: CommandType.SellHotel, position })}
          onMortgage={(position) => dispatch({ type: CommandType.Mortgage, position })}
          onUnmortgage={(position) => dispatch({ type: CommandType.Unmortgage, position })}
          onSellProperty={(position) => dispatch({ type: CommandType.SellProperty, position })}
          onClose={() => setCenterOverlay(null)}
        />
      );
    }

    if (centerOverlay === 'trade-builder' && tradeBuilderData) {
      return (
        <TradeBuilder
          me={tradeBuilderData.me}
          others={tradeBuilderData.others}
          myProperties={tradeBuilderData.myProperties}
          myJailCards={tradeBuilderData.myJailCards}
          propertiesOf={tradeBuilderData.propertiesOf}
          jailCardsOf={tradeBuilderData.jailCardsOf}
          onPropose={handleTradePropose}
          onClose={() => setCenterOverlay(null)}
        />
      );
    }

    return null;
  }

  function renderGameCenter() {
    const fullOverlay = renderFullCenterOverlay();
    const dimmedCenterStyle = {
      opacity: isBuyDecisionForViewer ? 0.15 : 1,
      filter: isBuyDecisionForViewer ? 'saturate(0.82)' : 'saturate(1)',
      transition: 'opacity 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms cubic-bezier(0.22, 1, 0.36, 1)',
    };
    const disabledButtonStyle = {
      backgroundColor: GAME_BOARD_COLORS.surface,
      borderColor: GAME_BOARD_COLORS.border,
      color: GAME_BOARD_COLORS.muted,
    };

    return (
      <div className="relative h-full w-full">
        <div className="grid h-full w-full grid-cols-6 grid-rows-5 gap-[6px] p-[6px]">
          <div
            className="col-span-2 row-span-2 min-h-0 overflow-hidden rounded-[12px]"
            style={dimmedCenterStyle}
          >
            <DiceWindow diceRoll={diceRoll} rollId={animatedDiceRollId} />
          </div>

          <section
            className="col-span-4 col-start-3 row-span-2 grid min-h-0 grid-cols-3 gap-[6px]"
            style={dimmedCenterStyle}
          >
            <button
              type="button"
              onClick={handleRoll}
              disabled={!canRoll}
              className="col-span-2 rounded-[12px] border px-3 py-2 font-display text-xl font-black uppercase tracking-[0.12em] disabled:cursor-not-allowed"
              style={canRoll ? {
                backgroundColor: BOARD_TILE_COLORS.propertyGreen,
                borderColor: BOARD_TILE_COLORS.propertyGreen,
                color: BOARD_TILE_COLORS.altText,
                transition: 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
              } : disabledButtonStyle}
            >
              {isRolling ? 'Rolling' : 'Roll'}
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand(CommandType.EndTurn)}
              disabled={!permissions.canEndTurn}
              className="rounded-[12px] border px-3 py-2 font-display text-sm font-black uppercase tracking-[0.1em] disabled:cursor-not-allowed"
              style={permissions.canEndTurn ? {
                backgroundColor: BOARD_TILE_COLORS.propertyRed,
                borderColor: BOARD_TILE_COLORS.propertyRed,
                color: BOARD_TILE_COLORS.altText,
                transition: 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
              } : disabledButtonStyle}
            >
              End turn
            </button>
            <button
              type="button"
              onClick={() => setCenterOverlay('manage')}
              disabled={!canManage}
              className="rounded-[12px] border px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] disabled:cursor-not-allowed"
              style={canManage ? {
                backgroundColor: GAME_BOARD_COLORS.surface,
                borderColor: GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.text,
                transition: 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
              } : disabledButtonStyle}
            >
              Manage
            </button>
            <button
              type="button"
              onClick={() => setCenterOverlay('trade-builder')}
              disabled={!permissions.canTrade || !tradeBuilderData?.others.length}
              className="rounded-[12px] border px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] disabled:cursor-not-allowed"
              style={(permissions.canTrade && Boolean(tradeBuilderData?.others.length)) ? {
                backgroundColor: GAME_BOARD_COLORS.surface,
                borderColor: GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.text,
                transition: 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
              } : disabledButtonStyle}
            >
              Trade
            </button>
            <div
              className="flex min-w-0 items-center justify-center rounded-[12px] border px-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                backgroundColor: GAME_BOARD_COLORS.surface,
                borderColor: GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.muted,
              }}
            >
              {isViewerTurn ? 'Your turn' : `Round ${game.turn.roundNumber}`}
            </div>
          </section>

          <div
            className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0 overflow-hidden rounded-[12px]"
            style={dimmedCenterStyle}
          >
            {renderCenterPanel()}
          </div>

          <div className="col-span-2 col-start-5 row-span-3 row-start-3 min-h-0 overflow-hidden">
            <DeedWindow
              space={deedPanelSpace}
              decisionSpace={isBuyDecisionForViewer ? pendingBuySpace : null}
              canAct={isBuyDecisionForViewer}
              onBuy={handleBuy}
              onAuction={handlePassBuy}
              viewOnly={!isBuyDecisionForViewer}
            />
          </div>
        </div>

        {fullOverlay && (
          <div
            className="absolute inset-[6px] z-10 overflow-hidden rounded-[12px] border"
            style={{
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor: GAME_BOARD_COLORS.border,
            }}
          >
            {fullOverlay}
          </div>
        )}
      </div>
    );
  }

  if (
    !roomBootTimedOut &&
    (
      !ready ||
      !sessionHydrated ||
      isJoiningByCode ||
      isValidatingSession ||
      (currentSession && validatedSessionId !== currentSession.id && !sessionRestoreFailed)
    )
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
          <Button as="a" href="/lobby" variant="blue" className="mt-4">
            Back to lobby
          </Button>
        </section>
      </main>
    );
  }

  if (!currentSession) {
    return <NoActiveRoomState />;
  }

  if (validatedSessionId !== currentSession.id) {
    return <NoActiveRoomState />;
  }

  const isWaitingSession =
    currentSession.status === SessionStatus.WAITING ||
    (game.status === GameStatus.LOBBY && game.players.length === 0);

  return (
    <main className="relative h-screen min-h-0 w-full overflow-hidden bg-paper">
      <WsErrorBanner error={wsError} onDismiss={clearWsError} />

      {isWaitingSession ? (
        <div className="h-full min-h-0 p-3 pt-14">
          <BoardContainer
            centerContent={(
              <WaitingCenterPanel
                session={currentSession}
                messages={lobbyMessages}
                onSendMessage={sendChat}
                onLeave={handleLeaveRoom}
                onStart={handleStartGame}
                isLeaving={isLeaving}
                isStarting={isStarting}
                socketStatus={status}
              />
            )}
            sidebarPlayers={waitingSidebarPlayers}
          />
        </div>
      ) : game.players.length === 0 ? (
        <div className="h-full min-h-0 p-3 pt-14">
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
          centerContent={renderGameCenter()}
          spaces={game.spaces}
          players={boardPlayers}
          walkingPlayers={walkingPlayers}
          sidebarPlayers={sidebarPlayers}
          selectedPosition={highlightedBoardPosition}
          onSelectPosition={handleSelectBoardPosition}
        />
      )}
    </main>
  );
}
