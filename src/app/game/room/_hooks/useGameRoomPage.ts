'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { deriveBoardPlayers, deriveSidebarPlayers } from '@/features/game-board/game-board.adapters';
import { SessionStatus } from '@/shared/protocol/session';
import { useBoardSfx } from '@/shared/hooks/useBoardSfx';
import { useOnWsError } from '@/shared/hooks/useOnWsError';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { getViewerPlayer } from '@/shared/protocol/selectors';
import { GameStatus } from '@/shared/protocol/game-state.enums';
import type { TradeOffer } from '@/shared/protocol/game-state';
import { CommandType } from '@/shared/protocol/commands';
import { useGameSocket } from '@/shared/socket/useGameSocket';
import { resolveAnimationGate } from '@/shared/socket/timeline-executor';
import { useGameStore } from '@/stores/game-store';
import { useSessionStore } from '@/stores/session-store';
import { useSocketStore } from '@/stores/socket-store';
import { useChatStore } from '@/stores/chat-store';
import { useUiStore } from '@/stores/ui-store';
import type { WsErrorPayload } from '@/shared/protocol/messages.schema';
import { ActiveOverlay, RoomPhase, type GameBoardWidgetProps } from '@/widgets/game-board';
import { useGameDispatch } from '../useGameDispatch';
import { useRoomSession } from './useRoomSession';
import { useTradeDraft } from './useTradeDraft';
import { getManageProperties } from '../_lib/game-spaces';
import {
  buildBoardFocusPositions,
  buildBoardSelectionTones,
  buildChatMessages,
  buildTradeBuilderData,
  buildTradeParticipants,
  buildWaitingSidebarPlayers,
  buildWalkingPlayers,
  resolveDeedSelection,
  resolveWinnerName,
} from '../_lib/room-view-model';

export interface GameRoomPageState {
  isLoading: boolean;
  loadError: string | null;
  hasNoSession: boolean;
  wsError: WsErrorPayload | null;
  clearWsError: () => void;
  isScreenShaking: boolean;
  widgetProps: GameBoardWidgetProps | null;
}

export function useGameRoomPage(): GameRoomPageState {
  const { ready, user } = useRequireAuth();
  const { dispatch } = useGameDispatch();
  const isMobile = useIsMobile();
  const routeSessionId = useParams<{ sessionId: string }>().sessionId;

  const session = useRoomSession(routeSessionId, ready);
  const {
    currentSession,
    sessionId,
    canConnectSocket,
    loadError,
    isLoading,
    isLeaving,
    isStarting,
    handleStartGame,
    handleLeaveRoom,
  } = session;

  const snapshot    = useGameStore((s) => s.snapshot);
  const game        = snapshot.game;
  const permissions = snapshot.permissions;

  const status      = useSocketStore((s) => s.status);
  const wsError     = useSocketStore((s) => s.wsError);
  const clearWsError = useSocketStore((s) => s.clearWsError);
  const chatBySession = useChatStore((s) => s.bySession);

  const isRolling               = useUiStore((s) => s.isRolling);
  const isTimelineRunning       = useUiStore((s) => s.isTimelineRunning);
  const walkState               = useUiStore((s) => s.walkState);
  const animatedDiceRoll        = useUiStore((s) => s.animatedDiceRoll);
  const animatedDiceRollId      = useUiStore((s) => s.animatedDiceRollId);
  const activeAnimationCard     = useUiStore((s) => s.activeAnimationCard);
  const pendingAnimationInteraction = useUiStore((s) => s.pendingAnimationInteraction);
  const selectedTile            = useUiStore((s) => s.selectedTile);
  const setSelectedTile         = useUiStore((s) => s.setSelectedTile);

  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay | null>(null);

  const { sendChat, sendSticker } = useGameSocket(canConnectSocket ? sessionId : null);
  const isScreenShaking = useOnWsError(wsError);

  useBoardSfx(game);

  // ─── Derived values ────────────────────────────────────────────────────────

  const viewerPlayer = useMemo(() => getViewerPlayer(game, user?.id), [game, user?.id]);

  const setViewerBankruptInSession = useSessionStore((s) => s.setViewerBankruptInSession);
  useEffect(() => {
    if (viewerPlayer?.isBankrupt && game.status === GameStatus.IN_PROGRESS) {
      setViewerBankruptInSession();
    }
  }, [viewerPlayer?.isBankrupt, game.status, setViewerBankruptInSession]);

  const viewerPlayerId = viewerPlayer?.id ?? (game.viewerId || null);

  const trade      = useTradeDraft({ game, viewerPlayer, viewerPlayerId, activeOverlay, setSelectedTile });
  const tradeDraft = trade.tradeDraft;

  const boardPlayers          = useMemo(() => deriveBoardPlayers(game), [game]);
  const sidebarPlayers        = useMemo(() => deriveSidebarPlayers(game), [game]);
  const waitingSidebarPlayers = useMemo(() => buildWaitingSidebarPlayers(currentSession), [currentSession]);
  const walkingPlayers        = useMemo(() => buildWalkingPlayers(game, walkState), [game, walkState]);
  const manageProperties      = useMemo(() => getManageProperties(game, viewerPlayerId), [game, viewerPlayerId]);
  const tradeParticipants     = useMemo(() => buildTradeParticipants(game), [game]);
  const tradeBuilderData      = useMemo(
    () => buildTradeBuilderData(game, viewerPlayer, tradeDraft),
    [game, tradeDraft, viewerPlayer],
  );

  const tokenByUserId = useMemo(
    () => new Map(game.players.map((p) => [p.userId, p.token])),
    [game.players],
  );
  const chatMessages = useMemo(
    () => buildChatMessages(chatBySession[sessionId] ?? [], tokenByUserId),
    [chatBySession, sessionId, tokenByUserId],
  );

  const diceRoll          = animatedDiceRoll ?? game.turn.diceRoll;
  const activeCard        = activeAnimationCard ?? game.activeCard;
  const pendingBuyPosition = game.turn.pendingBuyPosition;
  const isViewerTurn      = Boolean(viewerPlayerId && game.turn.currentPlayerId === viewerPlayerId);

  const { pendingBuySpace, isBuyDecisionForViewer, highlightedBoardPosition, deedPanelSpace } =
    resolveDeedSelection(pendingBuyPosition, selectedTile, viewerPlayer?.position, isViewerTurn, game.gameMode);

  const tradeSelectionTones = useMemo(
    () => buildBoardSelectionTones(activeOverlay, tradeDraft, game),
    [activeOverlay, tradeDraft, game],
  );
  const tradeFocusPositions = useMemo(
    () => buildBoardFocusPositions(activeOverlay, tradeDraft, game),
    [activeOverlay, tradeDraft, game],
  );
  const boardFocusPositions = isBuyDecisionForViewer && pendingBuyPosition != null
    ? new Set([pendingBuyPosition])
    : tradeFocusPositions;

  const canRoll   = (permissions.canRoll || permissions.canRollInJail) && !isRolling && !isTimelineRunning;
  const canManage =
    permissions.canBuildHouse || permissions.canBuildHotel ||
    permissions.canMortgage   || permissions.canUnmortgage ||
    manageProperties.length > 0 ||
    Boolean(
      pendingBuySpace && isViewerTurn && manageProperties.length > 0 && viewerPlayer &&
      pendingBuySpace.price != null && viewerPlayer.balance < pendingBuySpace.price,
    );

  // Clear selected tile when viewer's walk animation finishes on mobile
  const prevWalkRef = useRef(walkState);
  useEffect(() => {
    const prev = prevWalkRef.current;
    prevWalkRef.current = walkState;
    if (isMobile && prev && !walkState && prev.playerId === viewerPlayerId) {
      setSelectedTile(null);
    }
  }, [isMobile, walkState, viewerPlayerId, setSelectedTile]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const dispatchCommand = useCallback(
    (type: CommandType, payload: Record<string, unknown> = {}) => {
      dispatch({ type, ...payload } as Parameters<typeof dispatch>[0]);
    },
    [dispatch],
  );

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

  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null);
    trade.resetDraft();
  }, [trade]);

  const handleTradeOpen = useCallback(() => {
    trade.resetDraft();
    setActiveOverlay(ActiveOverlay.TRADE_BUILDER);
  }, [trade]);

  const handleTradePropose = useCallback(() => {
    if (!tradeDraft.targetId) return;
    const offer: TradeOffer = {
      money: tradeDraft.giveMoney,
      positions: [...tradeDraft.givePositions],
      getOutOfJailCards: tradeDraft.giveCards,
    };
    const request: TradeOffer = {
      money: tradeDraft.getMoney,
      positions: [...tradeDraft.getPositions],
      getOutOfJailCards: tradeDraft.getCards,
    };
    dispatch({ type: CommandType.StartTrade, targetId: tradeDraft.targetId, offer, request });
    handleCloseOverlay();
  }, [dispatch, handleCloseOverlay, tradeDraft]);

  const handleCardProceed = useCallback(() => {
    const pending = useUiStore.getState().pendingAnimationInteraction;
    if (pending) {
      dispatch({ type: CommandType.AnimationContinue, interactionId: pending.interactionId });
      resolveAnimationGate(pending.interactionId);
      return;
    }
    dispatch({ type: CommandType.ResolveCard });
  }, [dispatch]);

  // ─── Guard conditions ──────────────────────────────────────────────────────

  const isPageLoading = !ready || isLoading;
  const hasNoSession  = !currentSession || currentSession.id !== sessionId;

  if (isPageLoading || hasNoSession) {
    return { isLoading: isPageLoading, loadError, hasNoSession, wsError, clearWsError, isScreenShaking, widgetProps: null };
  }

  // ─── Phase determination ───────────────────────────────────────────────────

  const isWaitingSession =
    currentSession.status === SessionStatus.WAITING ||
    (game.status === GameStatus.LOBBY && game.players.length === 0);
  const isFinishedSession =
    currentSession.status === SessionStatus.FINISHED ||
    game.status === GameStatus.FINISHED;

  const boardDisplayData = {
    spaces: game.spaces,
    boardPlayers,
    walkingPlayers,
    sidebarPlayers,
    log: game.log,
    selectedPosition: highlightedBoardPosition,
    tileSelectionTones: tradeSelectionTones,
    focusPositions: boardFocusPositions,
    onSelectPosition: trade.selectBoardPosition,
    viewerId: viewerPlayerId ?? undefined,
    createdAt: game.createdAt,
    gameMode: game.gameMode,
    onSurrender: () => dispatchCommand(CommandType.Surrender),
  };

  // ─── Widget props ──────────────────────────────────────────────────────────

  let widgetProps: GameBoardWidgetProps;

  if (isWaitingSession) {
    widgetProps = {
      phase: RoomPhase.WAITING,
      gameMode: currentSession.game_mode,
      waitingSidebarPlayers,
      waiting: {
        inviteCode: currentSession.invite_code,
        memberCount: currentSession.member_count,
        maxPlayers: currentSession.max_players,
        yourRole: currentSession.your_role,
        messages: chatMessages,
        viewerUserId: user?.id,
        onSendMessage: sendChat,
        onSendSticker: sendSticker,
        onLeave: handleLeaveRoom,
        onStart: handleStartGame,
        isLeaving,
        isStarting,
      },
    };
  } else if (isFinishedSession) {
    widgetProps = {
      phase: RoomPhase.FINISHED,
      ...boardDisplayData,
      winnerName: resolveWinnerName(game),
      isLeaving,
      onLeave: handleLeaveRoom,
    };
  } else if (game.players.length === 0) {
    widgetProps = {
      phase: RoomPhase.EMPTY,
      gameMode: game.gameMode,
      sessionCode: currentSession.invite_code,
      wsStatus: status,
    };
  } else {
    widgetProps = {
      phase: RoomPhase.PLAYING,
      ...boardDisplayData,
      center: {
        isBuyDecisionForViewer,
        animatedDiceRollId,
        deedPanelSpace,
        pendingBuySpace,
        canRoll,
        canBuyProperty: permissions.canBuyProperty,
        canManage,
        canEndTurn: permissions.canEndTurn,
        canTrade: permissions.canTrade,
        hasOtherTraders: Boolean(tradeBuilderData?.others.length),
        isRolling,
        isViewerTurn,
        roundNumber: game.turn.roundNumber,
        turnDeadlineMs: game.turn.turnDeadlineMs,
        canSurrender: permissions.canSurrender,
        onRoll: handleRoll,
        onEndTurn: () => dispatchCommand(CommandType.EndTurn),
        onManageOpen: () => setActiveOverlay(ActiveOverlay.MANAGE),
        onTradeOpen: handleTradeOpen,
        onBuy: handleBuy,
        onAuction: handlePassBuy,
        onSurrender: () => dispatchCommand(CommandType.Surrender),
        activeCard,
        pendingInteractionPlayerId: pendingAnimationInteraction?.affectedPlayerId ?? null,
        onCardProceed: handleCardProceed,
        viewerPlayerId,
        debt: game.debt,
        auction: game.auction,
        auctionPlayers: game.players.map((p) => ({ id: p.id, name: p.displayName })),
        turnPhase: game.turn.phase,
        jailStatus: viewerPlayer?.jailStatus ?? null,
        diceRoll,
        canPayDebt: permissions.canPayDebt,
        canBidAuction: permissions.canBidAuction,
        canRollInJail: permissions.canRollInJail,
        canPayJailFine: permissions.canPayJailFine,
        canUseJailCard: permissions.canUseJailCard,
        log: game.log,
        chatMessages,
        viewerToken: viewerPlayer?.token,
        viewerUserId: user?.id,
        onPayDebt: () => dispatchCommand(CommandType.PayDebt),
        onManage: () => setActiveOverlay(ActiveOverlay.MANAGE),
        onBankrupt: () => dispatchCommand(CommandType.DeclareBankruptcy),
        onBidAuction: (amount: number) => dispatch({ type: CommandType.BidAuction, amount }),
        onPayJailFine: () => dispatchCommand(CommandType.PayJailFine),
        onUseJailCard: () => dispatchCommand(CommandType.UseJailCard),
        onSendMessage: sendChat,
        onSendSticker: sendSticker,
        trade: game.trade,
        tradeProposer: tradeParticipants.proposer,
        tradeTarget: tradeParticipants.target,
        activeOverlay,
        manageProperties,
        canBuildHouse: permissions.canBuildHouse,
        canBuildHotel: permissions.canBuildHotel,
        canMortgage: permissions.canMortgage,
        canUnmortgage: permissions.canUnmortgage,
        tradeBuilderData,
        onTradeAccept: () => dispatch({ type: CommandType.AcceptTrade, tradeId: game.trade!.id }),
        onTradeReject: () => dispatch({ type: CommandType.RejectTrade, tradeId: game.trade!.id }),
        onTradeCancel: () => dispatch({ type: CommandType.RejectTrade, tradeId: game.trade!.id }),
        onBuildHouse:    (pos: number) => dispatch({ type: CommandType.BuildHouse,    position: pos }),
        onBuildHotel:    (pos: number) => dispatch({ type: CommandType.BuildHotel,    position: pos }),
        onSellHouse:     (pos: number) => dispatch({ type: CommandType.SellHouse,     position: pos }),
        onSellHotel:     (pos: number) => dispatch({ type: CommandType.SellHotel,     position: pos }),
        onMortgage:      (pos: number) => dispatch({ type: CommandType.Mortgage,      position: pos }),
        onUnmortgage:    (pos: number) => dispatch({ type: CommandType.Unmortgage,    position: pos }),
        onSellProperty:  (pos: number) => dispatch({ type: CommandType.SellProperty,  position: pos }),
        onCloseOverlay: handleCloseOverlay,
        onTradeGiveMoneyChange: trade.onGiveMoneyChange,
        onTradeGetMoneyChange:  trade.onGetMoneyChange,
        onTradeGiveCardsChange: trade.onGiveCardsChange,
        onTradeGetCardsChange:  trade.onGetCardsChange,
        onTradeClearOfferAssets:   trade.onClearOfferAssets,
        onTradeClearRequestAssets: trade.onClearRequestAssets,
        onTradePropose: handleTradePropose,
      },
    };
  }

  return { isLoading: false, loadError: null, hasNoSession: false, wsError, clearWsError, isScreenShaking, widgetProps };
}
