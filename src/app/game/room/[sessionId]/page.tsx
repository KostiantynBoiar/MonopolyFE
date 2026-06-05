'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BoardContainer,
  deriveBoardPlayers,
  deriveSidebarPlayers,
  resolveTokenShape,
} from '@/features/game-board';
import { SessionStatus } from '@/features/lobby';
import { BOARD } from '@/shared/config/board-layout';
import { TOKEN_COLORS, TOKEN_ORDER } from '@/shared/config/constants';
import { useBoardSfx } from '@/shared/hooks/useBoardSfx';
import { useOnWsError } from '@/shared/hooks/useOnWsError';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { WalkingAnimationVariant } from '@/shared/protocol/animation';
import { getViewerPlayer } from '@/shared/protocol/selectors';
import { GameStatus } from '@/shared/protocol/game-state.enums';
import type { TradeOffer } from '@/shared/protocol/game-state';
import { CommandType } from '@/shared/protocol/commands';
import { useGameSocket } from '@/shared/socket';
import { resolveAnimationGate } from '@/shared/socket/timeline-executor';
import { FullScreenSpinner, MessageScreen, WsErrorBanner } from '@/shared/ui';
import { useGameStore } from '@/stores/game-store';
import { useSocketStore } from '@/stores/socket-store';
import { useChatStore } from '@/stores/chat-store';
import { useUiStore } from '@/stores/ui-store';
import { useGameDispatch } from '../useGameDispatch';
import { ActiveOverlay, type TradeBuilderData } from '../_components/FullOverlay';
import { GameCenterGrid } from '../_components/GameCenterGrid';
import { WaitingCenterGrid } from '../_components/WaitingCenterGrid';
import { EmptyGameState, FinishedGameState } from '../_components/RoomStates';
import { useRoomSession } from '../_hooks/useRoomSession';
import { useTradeDraft } from '../_hooks/useTradeDraft';
import { getManageProperties } from '../_lib/game-spaces';
import { buildTradeSelectionTones } from '../_lib/trade-draft';
import {
  toTradeAsset,
  toTradeCounterparty,
  toTradeParticipant,
  toTradePlayer,
} from '../_lib/trade-mappers';

export default function GameRoomPage() {
  const { ready, user } = useRequireAuth();
  const { dispatch } = useGameDispatch();

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

  const snapshot = useGameStore((state) => state.snapshot);
  const game = snapshot.game;
  const permissions = snapshot.permissions;

  const status = useSocketStore((state) => state.status);
  const wsError = useSocketStore((state) => state.wsError);
  const clearWsError = useSocketStore((state) => state.clearWsError);
  const chatBySession = useChatStore((state) => state.bySession);

  const isRolling = useUiStore((state) => state.isRolling);
  const isTimelineRunning = useUiStore((state) => state.isTimelineRunning);
  const walkState = useUiStore((state) => state.walkState);
  const animatedDiceRoll = useUiStore((state) => state.animatedDiceRoll);
  const animatedDiceRollId = useUiStore((state) => state.animatedDiceRollId);
  const activeAnimationCard = useUiStore((state) => state.activeAnimationCard);
  const pendingAnimationInteraction = useUiStore((state) => state.pendingAnimationInteraction);
  const selectedTile = useUiStore((state) => state.selectedTile);
  const setSelectedTile = useUiStore((state) => state.setSelectedTile);

  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay | null>(null);

  const { sendChat, sendSticker } = useGameSocket(canConnectSocket ? sessionId : null);
  const isScreenShaking = useOnWsError(wsError);

  useBoardSfx(game);

  // ─── Derived values ────────────────────────────────────────────────────────

  const viewerPlayer = useMemo(() => getViewerPlayer(game, user?.id), [game, user?.id]);
  const viewerPlayerId = viewerPlayer?.id ?? (game.viewerId || null);

  const trade = useTradeDraft({ game, viewerPlayer, viewerPlayerId, activeOverlay, setSelectedTile });
  const tradeDraft = trade.tradeDraft;

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
      rating: m.rating,
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
      tokenShape: resolveTokenShape(game.gameId, player?.turnOrder ?? 0),
      variant: walkState.variant ?? WalkingAnimationVariant.NORMAL,
    }];
  }, [game.players, game.gameId, walkState]);

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
      .map((player) => toTradeCounterparty(game, player));
    const target = others.find((player) => player.id === tradeDraft.targetId) ?? null;
    return {
      me: toTradePlayer(viewerPlayer),
      others,
      target,
      offerAssets: [...tradeDraft.givePositions].map((position) => toTradeAsset(game, position)),
      requestAssets: [...tradeDraft.getPositions].map((position) => toTradeAsset(game, position)),
      giveMoney: tradeDraft.giveMoney,
      getMoney: tradeDraft.getMoney,
      giveCards: tradeDraft.giveCards,
      getCards: tradeDraft.getCards,
    };
  }, [game, tradeDraft, viewerPlayer]);

  const tokenByUserId = useMemo(
    () => new Map(game.players.map((p) => [p.userId, p.token])),
    [game.players],
  );

  // Chat history comes from the client-persisted store (survives refresh/reconnect).
  // Ownership is decided in ChatWindow via fromUserId; token only drives the sender dot.
  const chatMessages = useMemo(
    () => (chatBySession[sessionId] ?? []).map((m) => ({
      id: m.id,
      kind: 'chat' as const,
      fromUserId: m.from_user_id,
      author: m.display_name,
      token: tokenByUserId.get(m.from_user_id),
      text: m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
      ts: Date.parse(m.ts),
    })),
    [chatBySession, sessionId, tokenByUserId],
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
  const tradeSelectionTones = useMemo(
    () => activeOverlay === ActiveOverlay.TRADE_BUILDER
      ? buildTradeSelectionTones(tradeDraft.givePositions, tradeDraft.getPositions)
      : undefined,
    [activeOverlay, tradeDraft.givePositions, tradeDraft.getPositions],
  );
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

  // ─── Boot guards ──────────────────────────────────────────────────────────

  if (!ready || isLoading) {
    return <FullScreenSpinner />;
  }

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

  if (!currentSession || currentSession.id !== sessionId) {
    return (
      <MessageScreen
        title="No active room"
        message="Join or create a room from the lobby to continue."
        action={{ label: 'Back to lobby', href: '/lobby' }}
      />
    );
  }

  const isWaitingSession =
    currentSession?.status === SessionStatus.WAITING ||
    (game.status === GameStatus.LOBBY && game.players.length === 0);
  const isFinishedSession =
    currentSession?.status === SessionStatus.FINISHED ||
    game.status === GameStatus.FINISHED;
  const winnerName = game.winnerId
    ? game.players.find((player) => player.id === game.winnerId)?.displayName ?? null
    : null;

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
                messages={chatMessages}
                viewerUserId={user?.id}
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
              turnDeadlineMs={game.turn.turnDeadlineMs}
              canSurrender={permissions.canSurrender}
              // Button handlers
              onRoll={handleRoll}
              onEndTurn={() => dispatchCommand(CommandType.EndTurn)}
              onManageOpen={() => setActiveOverlay(ActiveOverlay.MANAGE)}
              onTradeOpen={handleTradeOpen}
              onBuy={handleBuy}
              onAuction={handlePassBuy}
              onSurrender={() => dispatchCommand(CommandType.Surrender)}
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
              chatMessages={chatMessages}
              viewerToken={viewerPlayer?.token}
              viewerUserId={user?.id}
              onCardProceed={handleCardProceed}
              onPayDebt={() => dispatchCommand(CommandType.PayDebt)}
              onManage={() => setActiveOverlay(ActiveOverlay.MANAGE)}
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
              onCloseOverlay={handleCloseOverlay}
              onTradeGiveMoneyChange={trade.onGiveMoneyChange}
              onTradeGetMoneyChange={trade.onGetMoneyChange}
              onTradeGiveCardsChange={trade.onGiveCardsChange}
              onTradeGetCardsChange={trade.onGetCardsChange}
              onTradeClearOfferAssets={trade.onClearOfferAssets}
              onTradeClearRequestAssets={trade.onClearRequestAssets}
              onTradePropose={handleTradePropose}
            />
          )}
          spaces={game.spaces}
          players={boardPlayers}
          walkingPlayers={walkingPlayers}
          sidebarPlayers={sidebarPlayers}
          selectedPosition={highlightedBoardPosition}
          tileSelectionTones={tradeSelectionTones}
          onSelectPosition={trade.selectBoardPosition}
          focusPosition={isBuyDecisionForViewer ? pendingBuyPosition : null}
          viewerId={viewerPlayerId ?? undefined}
          createdAt={game.createdAt}
          onSurrender={() => dispatchCommand(CommandType.Surrender)}
        />
      )}
    </main>
  );
}
