'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BoardContainer, getWalkSteps } from '@/features/game-board';
import { PlayerSidebar, TOKEN_COLORS } from '@/features/player-panel';
import { BoardCenterPanel } from '@/features/chat/components/BoardCenterPanel';
import { WaitingCenterPanel, SessionStatus } from '@/features/lobby';
import { joinByCode, leaveSession, startGame } from '@/features/lobby/api';
import type { SessionMember } from '@/features/lobby';
import { BOARD } from '@/shared/config/board-layout';
import { SpaceType } from '@/features/game-board/game-board.enums';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { FullScreenSpinner } from '@/shared/ui/Spinner';
import { useSessionStore } from '@/stores/session-store';
import { useGameSocket } from '@/shared/socket';
import type { Player } from '@/features/player-panel';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board';
import type { GameState, ActiveCard, TradeState } from '@/shared/protocol/game-state.schema';
import type { TradeParticipant } from '@/features/trade';
import type { ChatMessage } from '@/features/chat/chat.types';
import { MOCK_GAME_STATE, logToChatMessages } from '@/shared/mocks/game-state.mock';
import { TOKEN_ORDER, WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import { WsErrorBanner } from '@/shared/ui/WsErrorBanner';
import { getDeedInfo } from '@/features/deed';
import type { DeedInfo } from '@/features/deed';
import type { AuctionPlayer } from '@/features/auction';

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
    proposerOffer: { money: 100, positions: [1, 3], getOutOfJailCards: 0 },
    targetRequest: { money: 0, positions: [5], getOutOfJailCards: 0 },
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

type WalkState = { playerId: string; currentPos: number };

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

  // Always-fresh ref so async callbacks (handleRoll) read current spaces without stale closure
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Tracks whether Bob's auto-bid in the current auction has already fired
  const autoBidFiredRef = useRef(false);

  const viewer = gameState.players.find((p) => p.id === gameState.viewerId)!;
  const actions = gameState.turn.actionsAvailable;

  // ── Auto-advance after post_roll ──────────────────────────────────────────
  // When the viewer is the current player, reset to pre_roll for endless mock turns.

  useEffect(() => {
    if (gameState.turn.phase !== 'post_roll') return;
    if (activeDeed !== null) return; // wait for buy/auction decision
    const isViewerTurn = gameState.turn.currentPlayerId === gameState.viewerId;
    const t = setTimeout(() => {
      setGameState((prev) => {
        if (prev.turn.phase !== 'post_roll') return prev;
        if (isViewerTurn) {
          return {
            ...prev,
            turn: {
              ...prev.turn,
              phase: 'pre_roll',
              diceRoll: null,
              actionsAvailable: {
                ...prev.turn.actionsAvailable,
                canRoll: true,
                canBuy: false,
                canBuild: false,
                canEndTurn: false,
              },
            },
          };
        }
        return advanceTurn(prev);
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [gameState.turn.phase, gameState.turn.turnNumber, gameState.turn.currentPlayerId, gameState.viewerId, activeDeed]);

  // ── Auction countdown ──────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState.turn.phase !== 'auction') {
      autoBidFiredRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.turn.phase !== 'auction' || !prev.auction) return prev;

        const newTime = Math.max(0, prev.auction.timeRemainingMs - 1000);
        let next: GameState = { ...prev, auction: { ...prev.auction, timeRemainingMs: newTime } };

        // Bob auto-bids at 7 s remaining
        if (newTime <= 7000 && !autoBidFiredRef.current) {
          autoBidFiredRef.current = true;
          const property = BOARD[prev.auction.propertyPosition];
          const bobBid = Math.floor((property?.price ?? 100) / 2);
          const bob = prev.players.find((p) => p.id === 'bob');
          if (bob && bobBid > prev.auction.highestBid) {
            next = {
              ...next,
              auction: {
                ...next.auction!,
                bids: [...next.auction!.bids, { playerId: 'bob', amount: bobBid }],
                highestBid: bobBid,
                highestBidderId: 'bob',
              },
              log: [...next.log, { id: `log_bid_${Date.now()}`, kind: 'event' as const, text: `Bob bids M${bobBid}.`, ts: new Date().toISOString() }],
            };
          }
        }

        // Resolve when time runs out
        if (newTime <= 0) {
          const winner = next.auction!.highestBidderId;
          const winAmount = next.auction!.highestBid;
          const propertyPos = next.auction!.propertyPosition;
          const winnerName = next.players.find((p) => p.id === winner)?.displayName ?? winner ?? 'Nobody';
          const logText = winner
            ? `${winnerName} won the auction for M${winAmount}.`
            : 'No bids. Property returns to the bank.';
          return {
            ...next,
            players: winner
              ? next.players.map((p) =>
                  p.id === winner
                    ? { ...p, balance: p.balance - winAmount, ownedPositions: [...p.ownedPositions, propertyPos] }
                    : p,
                )
              : next.players,
            spaces: next.spaces.map((s, i) => (i === propertyPos ? { ...s, ownerId: winner ?? null } : s)),
            auction: null,
            turn: { ...next.turn, phase: 'post_roll', actionsAvailable: { ...next.turn.actionsAvailable, canBid: false } },
            log: [...next.log, { id: `log_auction_end_${Date.now()}`, kind: 'event' as const, text: logText, ts: new Date().toISOString() }],
          };
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.turn.phase]);

  const handleRoll = useCallback(async () => {
    if (!actions.canRoll || isRolling) return;
    setIsRolling(true);

    // Phase 1: dice roll animation delay
    await new Promise<void>((r) => setTimeout(r, 1200));

    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const isDoubles = die1 === die2;
    const total = die1 + die2;
    const newPos = (viewer.position + total) % 40;

    // Stop dice spin and show result — walk starts after the player reads it
    setIsRolling(false);
    setGameState((prev) => ({
      ...prev,
      turn: {
        ...prev.turn,
        diceRoll: { die1, die2, isDoubles },
        actionsAvailable: { ...prev.turn.actionsAvailable, canRoll: false },
      },
    }));

    await new Promise<void>((r) => setTimeout(r, 500));

    // Phase 2: walk the token step-by-step
    const steps = getWalkSteps(viewer.position, newPos);
    await new Promise<void>((resolve) => {
      let i = 0;
      setWalkState({ playerId: viewer.id, currentPos: viewer.position });

      function step() {
        if (i >= steps.length) {
          resolve();
          return;
        }
        setWalkState({ playerId: viewer.id, currentPos: steps[i] });
        i++;
        setTimeout(step, WALK_STEP_DURATION_MS);
      }

      // Brief pause so the token renders at the start tile before transitioning
      setTimeout(step, 80);
    });

    // Phase 3: commit final position and clear walk overlay
    const drawnCard = makeMockCard(newPos);
    const landedSpace = BOARD[newPos];
    const isPurchasable =
      landedSpace != null &&
      (landedSpace.type === SpaceType.PROPERTY ||
        landedSpace.type === SpaceType.RAILROAD ||
        landedSpace.type === SpaceType.UTILITY);
    const isUnowned = gameStateRef.current.spaces[newPos]?.ownerId === null;
    const showDeed = !drawnCard && isPurchasable && isUnowned;

    setWalkState(null);
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === prev.viewerId ? { ...p, position: newPos } : p,
      ),
      activeCard: drawnCard,
      turn: {
        ...prev.turn,
        phase: drawnCard ? 'drawing_card' : 'post_roll',
        doublesStreak: isDoubles ? prev.turn.doublesStreak + 1 : 0,
        actionsAvailable: { ...prev.turn.actionsAvailable, canRoll: false, canEndTurn: false },
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

    if (showDeed) {
      setActiveDeed(getDeedInfo(newPos));
    }
  }, [actions.canRoll, isRolling, viewer]);

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

  // ── Buy property ──────────────────────────────────────────────────────────

  const handleBuy = useCallback(() => {
    if (!activeDeed) return;
    const { position, price, name } = activeDeed;
    setActiveDeed(null);
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === prev.viewerId
          ? { ...p, balance: p.balance - price, ownedPositions: [...p.ownedPositions, position] }
          : p,
      ),
      spaces: prev.spaces.map((s, i) => (i === position ? { ...s, ownerId: prev.viewerId } : s)),
      log: [
        ...prev.log,
        {
          id: `log_buy_${Date.now()}`,
          kind: 'event' as const,
          text: `${viewer.displayName} bought ${name} for M${price}.`,
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [activeDeed, viewer.displayName]);

  // ── Start auction ──────────────────────────────────────────────────────────

  const handleAuction = useCallback(() => {
    if (!activeDeed) return;
    const { position, name } = activeDeed;
    autoBidFiredRef.current = false;
    setActiveDeed(null);
    setGameState((prev) => ({
      ...prev,
      auction: {
        propertyPosition: position,
        bids: [],
        highestBid: 0,
        highestBidderId: null,
        timeRemainingMs: 10_000,
      },
      turn: {
        ...prev.turn,
        phase: 'auction',
        actionsAvailable: { ...prev.turn.actionsAvailable, canBid: true },
      },
      log: [
        ...prev.log,
        {
          id: `log_auction_start_${Date.now()}`,
          kind: 'event' as const,
          text: `${name} goes to auction!`,
          ts: new Date().toISOString(),
        },
      ],
    }));
  }, [activeDeed]);

  // ── Place bid ──────────────────────────────────────────────────────────────

  const handleBid = useCallback((amount: number) => {
    setGameState((prev) => {
      if (!prev.auction || amount <= prev.auction.highestBid) return prev;
      return {
        ...prev,
        auction: {
          ...prev.auction,
          bids: [...prev.auction.bids, { playerId: prev.viewerId, amount }],
          highestBid: amount,
          highestBidderId: prev.viewerId,
        },
        log: [
          ...prev.log,
          {
            id: `log_bid_${Date.now()}`,
            kind: 'event' as const,
            text: `${viewer.displayName} bids M${amount}.`,
            ts: new Date().toISOString(),
          },
        ],
      };
    });
  }, [viewer.displayName]);

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
      log: [...prev.log, { id: `log_trade_accept_${Date.now()}`, kind: 'event' as const, text: 'Trade accepted.', ts: new Date().toISOString() }],
    }));
    setTimeout(() => setGameState((prev) => ({ ...prev, trade: null })), 800);
  }, []);

  const handleTradeReject = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      trade: prev.trade ? { ...prev.trade, status: 'rejected' } : null,
      turn: { ...prev.turn, phase: 'post_roll' },
      log: [...prev.log, { id: `log_trade_reject_${Date.now()}`, kind: 'event' as const, text: 'Trade rejected.', ts: new Date().toISOString() }],
    }));
    setTimeout(() => setGameState((prev) => ({ ...prev, trade: null })), 800);
  }, []);

  const handleTradeCancel = useCallback(() => {
    setGameState((prev) => ({ ...prev, trade: null, turn: { ...prev.turn, phase: 'pre_roll' } }));
  }, []);

  const handleSendMessage = useCallback((text: string) => {
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
    ? (BOARD[gameState.auction.propertyPosition]?.name ?? 'Property')
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
