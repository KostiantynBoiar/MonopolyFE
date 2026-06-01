'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BoardContainer } from '@/features/game-board';
import { FloatingPlayerSidebar, TOKEN_COLORS } from '@/features/player-panel';
import { BoardCenterPanel } from '@/features/chat/components/BoardCenterPanel';
import type { Player } from '@/features/player-panel';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board';
import type { GameState } from '@/shared/protocol/game-state.schema';
import { TurnPhase, AuctionTargetKind, LogKind } from '@/shared/protocol/game-state.enums';
import type { LogEntry } from '@/shared/protocol/game-state';
import { CommandType } from '@/shared/protocol/commands';
import { getPlayerPositions, getPlayerProperties, getPropertyRent, hasMonopoly } from '@/shared/protocol/selectors';
import { BOARD } from '@/shared/config/board-layout';
import type { WsErrorPayload } from '@/shared/socket';
import type { ManageProperty } from '@/features/manage';
import type { TradeParticipant, TradeAsset } from '@/features/trade';
import type { TradeOffer } from '@/shared/protocol/game-state';
import { useGameStore, useUiStore, useSocketStore } from '@/stores';
import { resolveCardGate } from '@/shared/socket/snapshot-animator';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import type { AuctionPlayer } from '@/features/auction';
import { AuctionPanel } from '@/features/auction';
import { CardFlipOverlay } from '@/features/card';
import { DeedCard } from '@/features/deed';
import { JailModal } from '@/features/jail';
import { DebtModal } from '@/features/bankruptcy';
import { ManagePropertiesModal } from '@/features/manage';
import { TradeBuilder, TradeWindow } from '@/features/trade';
import { MobileGamePanel } from '@/features/chat/components/MobileGamePanel';
import { BOARD_W, BOARD_PX } from '@/shared/config/constants';
import { useGameDispatch } from './useGameDispatch';
import { useBoardSfx } from '@/shared/hooks/useBoardSfx';
import { playSfx } from '@/shared/lib/sfx';

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

// ─── GameBoard Component ───────────────────────────────────────────────────────

interface GameBoardProps {
  wsError: WsErrorPayload | null;
  onClearWsError: () => void;
  /** Send a chat/sticker message over the live socket (lifted from the page). */
  onSendChat: (text: string) => void;
}

export function GameBoard({ wsError, onClearWsError, onSendChat }: GameBoardProps) {
  // Server-authoritative: this component only renders the latest snapshot and sends
  // commands. There is NO client-side game simulation — opponents are real players
  // and every transition (turns, auctions, trades) is driven by the backend.
  const { snapshot, updateGame } = useGameStore();
  const { game: gameState, permissions } = snapshot;

  const { isRolling, walkState, activeDeed, setActiveDeed, openedModal, setOpenedModal } = useUiStore();
  const { messages: wsMessages } = useSocketStore();

  const { dispatch } = useGameDispatch();
  useBoardSfx(gameState);

  // ── Viewer ───────────────────────────────────────────────────────────────────

  const viewer = gameState.players.find((p) => p.id === gameState.viewerId) ?? null;

  // Merge in-game WS chat messages with the server game log. Chat entries are kept
  // separately from the snapshot (they're not in game.state.log) and re-merged on
  // each render so that incoming snapshots don't wipe them out.
  const combinedLog = useMemo<LogEntry[]>(() => {
    const chatEntries: LogEntry[] = wsMessages.map((m) => {
      const player = gameState.players.find((p) => p.userId === m.from_user_id);
      return {
        id:          m.id,
        kind:        m.kind === 'sticker' ? LogKind.STICKER : LogKind.CHAT,
        playerId:    m.from_user_id,
        playerName:  m.display_name,
        playerToken: player?.token,
        text:        m.kind === 'sticker' ? `[sticker:${m.sticker_url}]` : m.text,
        ts:          m.ts,
      };
    });
    return [...gameState.log, ...chatEntries].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
    );
  }, [wsMessages, gameState.log, gameState.players]);

  // ── Game handlers ──────────────────────────────────────────────────────────────

  const handleRoll = useCallback(() => {
    if (!permissions.canRoll || isRolling) return;
    playSfx('dice_roll');
    dispatch({ type: CommandType.RollDice });
  }, [permissions.canRoll, isRolling, dispatch]);

  const handleEndTurn = useCallback(() => {
    if (!permissions.canEndTurn) return;
    dispatch({ type: CommandType.EndTurn });
  }, [permissions.canEndTurn, dispatch]);

  // Cards are auto-resolved by the backend. "Proceed" (1) unblocks the snapshot
  // pipeline so the resolved frame can be applied and (2) dismisses the overlay
  // locally so the card disappears immediately rather than waiting for the commit.
  const handleCardProceed = useCallback(() => {
    resolveCardGate();
    updateGame((g) => ({ ...g, activeCard: null }));
  }, [updateGame]);

  const handleBuy = useCallback(() => {
    if (!activeDeed) return;
    setActiveDeed(null);
    dispatch({ type: CommandType.BuyProperty, position: activeDeed.position });
  }, [activeDeed, dispatch, setActiveDeed]);

  // Declining to buy → pass_buy, which opens the auction on the backend.
  const handleAuction = useCallback(() => {
    if (!activeDeed) return;
    setActiveDeed(null);
    dispatch({ type: CommandType.PassBuy });
  }, [activeDeed, dispatch, setActiveDeed]);

  const handleBid = useCallback((amount: number) => {
    playSfx('auction_bid');
    dispatch({ type: CommandType.BidAuction, amount });
  }, [dispatch]);

  // ── Jail decision ───────────────────────────────────────────────────────
  const handlePayJailFine = useCallback(() => dispatch({ type: CommandType.PayJailFine }), [dispatch]);
  const handleUseJailCard = useCallback(() => dispatch({ type: CommandType.UseJailCard }), [dispatch]);
  const handleRollInJail = useCallback(() => dispatch({ type: CommandType.RollInJail }), [dispatch]);

  // ── Property management ──────────────────────────────────────────────────
  const handleManage = useCallback(() => setOpenedModal('manage'), [setOpenedModal]);
  const handleBuildHouse = useCallback((position: number) => dispatch({ type: CommandType.BuildHouse, position }), [dispatch]);
  const handleBuildHotel = useCallback((position: number) => dispatch({ type: CommandType.BuildHotel, position }), [dispatch]);
  const handleSellHouse = useCallback((position: number) => dispatch({ type: CommandType.SellHouse, position }), [dispatch]);
  const handleSellHotel = useCallback((position: number) => dispatch({ type: CommandType.SellHotel, position }), [dispatch]);
  const handleMortgage = useCallback((position: number) => dispatch({ type: CommandType.Mortgage, position }), [dispatch]);
  const handleUnmortgage = useCallback((position: number) => dispatch({ type: CommandType.Unmortgage, position }), [dispatch]);

  // ── Debt resolution ──────────────────────────────────────────────────────
  const handlePayDebt = useCallback(() => dispatch({ type: CommandType.PayDebt }), [dispatch]);
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
  }, [dispatch]);

  const handleTradeReject = useCallback(() => {
    const tradeId = useGameStore.getState().snapshot.game.trade?.id ?? '';
    dispatch({ type: CommandType.RejectTrade, tradeId });
  }, [dispatch]);

  // Counter = open the trade builder so the target can compose their own terms.
  // The CounterTrade command is reserved for when the UI supports editing pre-filled
  // terms; for now, Reject + propose a new trade is the correct UX.
  const handleTradeCounter = useCallback(() => {
    setOpenedModal('trade');
  }, [setOpenedModal]);

  // The backend has no "cancel my own offer" command; the offer simply expires.
  // The button closes the local view without mutating authoritative state.
  const handleTradeCancel = useCallback(() => {}, []);

  const handleSendMessage = useCallback((text: string) => {
    onSendChat(text);
  }, [onSendChat]);

  // ── Derivations ────────────────────────────────────────────────────────────────

  const tradeProposer = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.proposerId) : undefined;
  const tradeTarget = gameState.trade
    ? deriveTradeParticipant(gameState, gameState.trade.targetId) : undefined;

  const walkingToken = walkState
    ? gameState.players.find((p) => p.id === walkState.playerId)?.token
    : undefined;
  const walkingBoardPlayers: WalkingPlayer[] = walkState && walkingToken
    ? [{ id: walkState.playerId, currentPos: walkState.currentPos, tokenColor: TOKEN_COLORS[walkingToken], fast: walkState.fast }]
    : [];

  const auctionPropertyName = gameState.auction
    ? gameState.auction.target.kind === AuctionTargetKind.PROPERTY
      ? (BOARD[gameState.auction.target.position]?.name ?? 'Property')
      : 'Property'
    : '';

  const auctionPlayers: AuctionPlayer[] = gameState.players.map((p) => ({
    id: p.id, name: p.displayName,
  }));

  // Phase-based: show the jail modal exactly when the backend says so.
  // Do NOT use jailStatus or diceRoll here — stale dice (from a free player's
  // previous roll) would re-trigger the modal on the next jail entry.
  const jailDecision =
    gameState.turn.phase === TurnPhase.JAIL_DECISION &&
    gameState.turn.currentPlayerId === gameState.viewerId;

  // If the backend leaves JAIL_DECISION without granting doubles the player's
  // turn is over — auto-dispatch EndTurn so other actions stay locked.
  // Track the previous value of jailDecision to detect the falling edge.
  const prevJailDecisionRef = useRef(jailDecision);
  const jailRollEndedRef = useRef(false);
  useEffect(() => {
    const prev = prevJailDecisionRef.current;
    prevJailDecisionRef.current = jailDecision;

    const failedJailRoll =
      prev && !jailDecision &&                             // just left JAIL_DECISION
      viewer?.jailStatus !== null &&                       // still in jail (no doubles)
      gameState.turn.currentPlayerId === gameState.viewerId &&
      !!gameState.turn.diceRoll && !gameState.turn.diceRoll.isDoubles &&
      permissions.canEndTurn;

    if (failedJailRoll && !jailRollEndedRef.current) {
      jailRollEndedRef.current = true;
      dispatch({ type: CommandType.EndTurn });
    }
    // Reset guard when the condition is gone (next turn / new jail stint)
    if (!failedJailRoll) jailRollEndedRef.current = false;
  }, [jailDecision, viewer?.jailStatus, gameState.turn.currentPlayerId,
      gameState.turn.diceRoll, permissions.canEndTurn, dispatch]);

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

  // ── Derived values used by both layouts ───────────────────────────────────────

  const canManageDeed = activeDeed !== null && manageProperties.some((p) => !p.isMortgaged);

  const isAuctionActive = gameState.auction !== null;
  const isTradeActive =
    gameState.trade !== null &&
    (gameState.trade.status === 'pending' || gameState.trade.status === 'countered') &&
    tradeProposer != null &&
    tradeTarget != null;

  const centerPanelProps = {
    log:                combinedLog,
    diceRoll:           gameState.turn.diceRoll,
    isRolling,
    canRoll:            permissions.canRoll && !isRolling,
    canBuy:             permissions.canBuyProperty,
    canManage,
    canTrade:           permissions.canTrade,
    canEndTurn:         permissions.canEndTurn,
    onRoll:             handleRoll,
    onEndTurn:          handleEndTurn,
    onSendMessage:      handleSendMessage,
    onManage:           handleManage,
    onTrade:            handleTrade,
    activeCard:         gameState.activeCard,
    onCardProceed:      handleCardProceed,
    activeDeed,
    canBuyDeed:         permissions.canBuyProperty,
    canManageDeed,
    onBuy:              handleBuy,
    onAuction:          handleAuction,
    onManageDeed:       handleManage,
    jailDecision,
    jailAttempts:       viewer?.jailStatus?.attempts ?? 0,
    canPayJailFine:     permissions.canPayJailFine,
    canUseJailCard:     permissions.canUseJailCard,
    canRollInJail:      permissions.canRollInJail && !isRolling,
    jailDiceRoll:       jailDecision || isRolling ? gameState.turn.diceRoll : null,
    jailIsRolling:      isRolling && jailDecision,
    onPayJailFine:      handlePayJailFine,
    onUseJailCard:      handleUseJailCard,
    onRollInJail:       handleRollInJail,
    debtPending,
    debtAmount,
    canPayDebt:         permissions.canPayDebt,
    onPayDebt:          handlePayDebt,
    onManageDebt:       handleManage,
    onDeclareBankruptcy: handleDeclareBankruptcy,
    auctionState:       gameState.auction,
    auctionPropertyName,
    auctionPlayers,
    canBid:             permissions.canBidAuction,
    onBid:              handleBid,
    tradeState:         gameState.trade,
    tradeProposer,
    tradeTarget,
    viewerId:           gameState.viewerId,
    onTradeAccept:      handleTradeAccept,
    onTradeReject:      handleTradeReject,
    onTradeCounter:     handleTradeCounter,
    onTradeCancel:      handleTradeCancel,
    manageOpen:         openedModal === 'manage',
    manageProperties,
    canBuildHouse:      permissions.canBuildHouse,
    canBuildHotel:      permissions.canBuildHotel,
    canMortgage:        permissions.canMortgage,
    canUnmortgage:      permissions.canUnmortgage,
    onBuildHouse:       handleBuildHouse,
    onBuildHotel:       handleBuildHotel,
    onSellHouse:        handleSellHouse,
    onSellHotel:        handleSellHotel,
    onMortgage:         handleMortgage,
    onUnmortgage:       handleUnmortgage,
    onCloseManage:      () => setOpenedModal(null),
    tradeBuilderOpen:   openedModal === 'trade',
    tradeMe:            { id: gameState.viewerId, name: viewer?.displayName ?? 'You', balance: viewer?.balance ?? 0 },
    tradeOthers,
    tradeMyProperties:  propertiesOf(gameState.viewerId),
    tradeMyJailCards:   jailCardsOf(gameState.viewerId),
    tradePropertiesOf:  propertiesOf,
    tradeJailCardsOf:   jailCardsOf,
    onTradePropose:     handleProposeTrade,
    onCloseTradeBuilder: () => setOpenedModal(null),
  } as const;

  const sidebarPlayers = deriveSidebarPlayers(gameState);
  const boardPlayers   = deriveBoardPlayers(gameState);

  return (
    <>
      {/* ── Mobile layout (< md) ──────────────────────────────────────────────── */}
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-paper md:hidden">
        <WsErrorBanner error={wsError} onDismiss={onClearWsError} />

        {/* Board — constrained to its natural aspect ratio so it doesn't eat the screen */}
        <div className="w-full shrink-0 p-1.5">
          <div style={{ aspectRatio: `${BOARD_W}/${BOARD_PX}` }} className="w-full">
            <BoardContainer
              spaces={gameState.spaces}
              players={boardPlayers}
              walkingPlayers={walkingBoardPlayers}
              centerContent={<BoardCenterPanel {...centerPanelProps} compact />}
            />
          </div>
        </div>

        {/* Bottom panel: auction / trade / normal game controls */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-line">
          {isAuctionActive ? (
            <AuctionPanel
              auctionState={gameState.auction!}
              propertyName={auctionPropertyName}
              viewerId={gameState.viewerId}
              players={auctionPlayers}
              canBid={permissions.canBidAuction}
              onBid={handleBid}
            />
          ) : isTradeActive ? (
            <TradeWindow
              trade={gameState.trade!}
              proposer={tradeProposer!}
              target={tradeTarget!}
              viewerId={gameState.viewerId}
              onAccept={handleTradeAccept}
              onReject={handleTradeReject}
              onCounter={handleTradeCounter}
              onCancel={handleTradeCancel}
            />
          ) : (
            <MobileGamePanel
              log={combinedLog}
              diceRoll={gameState.turn.diceRoll}
              isRolling={isRolling}
              canRoll={permissions.canRoll && !isRolling}
              canEndTurn={permissions.canEndTurn}
              canManage={canManage}
              canTrade={permissions.canTrade}
              onRoll={handleRoll}
              onEndTurn={handleEndTurn}
              onManage={handleManage}
              onTrade={handleTrade}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>

        {/* Full-screen overlays for deed / card / jail / debt / manage / trade-builder */}
        {gameState.activeCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
            <CardFlipOverlay card={gameState.activeCard} onProceed={handleCardProceed} />
          </div>
        )}
        {activeDeed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
            <DeedCard
              deed={activeDeed}
              canBuy={permissions.canBuyProperty}
              canManage={canManageDeed}
              onBuy={handleBuy}
              onAuction={handleAuction}
              onManage={handleManage}
            />
          </div>
        )}
        {jailDecision && !gameState.activeCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
            <JailModal
              attempts={viewer?.jailStatus?.attempts ?? 0}
              canPayFine={permissions.canPayJailFine}
              canUseCard={permissions.canUseJailCard}
              canRoll={permissions.canRollInJail}
              diceRoll={jailDecision || isRolling ? gameState.turn.diceRoll : null}
              isRolling={isRolling && jailDecision}
              onPayFine={handlePayJailFine}
              onUseCard={handleUseJailCard}
              onRoll={handleRollInJail}
            />
          </div>
        )}
        {debtPending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
            <DebtModal
              amount={debtAmount}
              canPay={permissions.canPayDebt}
              onPay={handlePayDebt}
              onManage={handleManage}
              onBankrupt={handleDeclareBankruptcy}
            />
          </div>
        )}
        {openedModal === 'manage' && (
          <div className="fixed inset-0 z-50">
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
              onSellProperty={undefined}
              onClose={() => setOpenedModal(null)}
            />
          </div>
        )}
        {openedModal === 'trade' && tradeOthers.length > 0 && (
          <div className="fixed inset-0 z-50">
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
        )}

        <FloatingPlayerSidebar players={sidebarPlayers} />
      </div>

      {/* ── Desktop layout (≥ md) ────────────────────────────────────────────── */}
      <div className="relative hidden h-screen overflow-hidden bg-paper md:flex">
        <WsErrorBanner error={wsError} onDismiss={onClearWsError} />
        <div className="flex-1 overflow-hidden p-4 pr-72">
          <BoardContainer
            spaces={gameState.spaces}
            players={boardPlayers}
            walkingPlayers={walkingBoardPlayers}
            centerContent={<BoardCenterPanel {...centerPanelProps} />}
          />
        </div>
        <FloatingPlayerSidebar players={sidebarPlayers} />
      </div>
    </>
  );
}
