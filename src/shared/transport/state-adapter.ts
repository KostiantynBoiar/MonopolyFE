/**
 * State adapter — the single translation seam between the backend `game.state`
 * wire payload (snake_case, server-authoritative) and the frontend's canonical
 * camelCase GameSnapshot ({ game, permissions }).
 *
 * The backend bakes per-viewer gating into `turn.actions_available`; the UI reads a
 * flat `permissions` object, so we derive it here. Fields the backend does not send
 * (decks — stripped server-side; machine-readable log events — BE log is text-only)
 * are filled with safe empties. This keeps the entire existing UI/selectors unchanged.
 *
 * This is pure translation: NO game logic lives here.
 */

import type {
  GameState,
  GameEvent,
  PlayerState,
  PropertyState,
  TurnState,
  DiceRoll,
  AuctionState,
  TradeState,
  TradeOffer,
  ActiveCard,
  DebtState,
  LogEntry,
} from '@/shared/protocol/game-state';
import type {
  TokenColor,
  LogKind,
  CardKind,
  TradeStatus} from '@/shared/protocol/game-state.enums';
import {
  GameMode,
  GameStatus,
  TurnPhase,
  DebtCreditorType,
  AuctionTargetKind,
} from '@/shared/protocol/game-state.enums';
import type { GameSnapshot, PlayerPermissions } from '@/shared/protocol/permissions';
import { EMPTY_PERMISSIONS } from '@/shared/protocol/permissions';
import type { AnimationInstruction } from '@/shared/protocol/animation';
import { logger } from '@/shared/lib/logger';

// ─── Backend wire shapes (snake_case) ─────────────────────────────────────────
// Minimal structural typing of the payload we receive in a `game.state` frame.
// Server-only fields (chance_deck/chest_deck) are stripped before we ever see them.

interface BeActionSet {
  can_roll?: boolean;
  can_buy?: boolean;
  can_build?: boolean;
  can_mortgage?: boolean;
  can_unmortgage?: boolean;
  can_trade?: boolean;
  can_end_turn?: boolean;
  can_pay_jail_fine?: boolean;
  can_use_jail_card?: boolean;
  can_bid?: boolean;
  can_declare_bankruptcy?: boolean;
  can_surrender?: boolean;
}

interface BeDiceRoll {
  die1: number;
  die2: number;
  is_doubles: boolean;
}

interface BeJailStatus {
  turns_remaining: number;
}

interface BePlayer {
  id: string;
  user_id: string;
  display_name: string;
  token: string;
  avatar_url?: string | null;
  turn_order: number;
  position: number;
  balance: number;
  owned_positions?: number[];
  get_out_of_jail_cards?: number;
  jail_status?: BeJailStatus | null;
  is_bankrupt?: boolean;
  is_connected?: boolean;
  net_worth?: number;
  afk_strikes?: number;
  rating?: number;
}

interface BeSpace {
  position: number;
  owner_id?: string | null;
  houses?: number;
  has_hotel?: boolean;
  is_mortgaged?: boolean;
}

interface BeTurn {
  phase: string;
  current_player_id: string;
  turn_number?: number;
  round_number?: number;
  dice_roll?: BeDiceRoll | null;
  doubles_streak?: number;
  actions_available?: BeActionSet;
  pending_buy_position?: number | null;
  turn_deadline_ms?: number | null;
}

interface BeAuctionBid {
  player_id: string;
  amount: number;
}

interface BeAuction {
  property_position: number;
  bids?: BeAuctionBid[];
  highest_bid?: number;
  highest_bidder_id?: string | null;
  time_remaining_ms?: number;
}

interface BeTradeOffer {
  money?: number;
  positions?: number[];
  get_out_of_jail_cards?: number;
}

interface BeTrade {
  id: string;
  proposer_id: string;
  target_id: string;
  proposer_offer: BeTradeOffer;
  target_request: BeTradeOffer;
  status: string;
  expires_at: string;
}

interface BeActiveCard {
  id: string;
  kind: string;
  text: string;
  effect: { type: string; [k: string]: unknown };
  drawer_id: string;
}

interface BeBankruptcy {
  debtor_id: string;
  creditor_id?: string | null;
  amount_owed?: number;
}

interface BeLogEntry {
  id: string;
  kind: string;
  ts: string;
  // chat / sticker only
  text?: string | null;
  sticker_url?: string | null;
  // event-kind flat fields (Pydantic strips nulls, so absent == null)
  type?: string | null;
  player_id?: string | null;
  player_name?: string | null;
  player_token?: string | null;
  opponent_id?: string | null;
  tile_id?: number | null;
  rolled?: number | null;
  spent?: number | null;
  received?: number | null;
  card_id?: string | null;
  card_kind?: string | null;
  reason?: string | null;
  streak?: number | null;
  strikes?: number | null;
  // extended event fields for types not yet in the wire-schema docs
  property_name?: string | null;
  position?: number | null;
  cost?: number | null;
  refund?: number | null;
  amount?: number | null;
  accepted?: boolean | null;
  proposer_id?: string | null;
  proposer_name?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  debtor_id?: string | null;
  debtor_name?: string | null;
  winner_id?: string | null;
  winner_name?: string | null;
  winner_amount?: number | null;
  round_number?: number | null;
  is_doubles?: boolean | null;
  trade_id?: string | null;
  creditor_id?: string | null;
}

interface BeRollDiceAnimation {
  type: 'roll_dice';
  player_id: string;
  die1: number;
  die2: number;
  is_doubles: boolean;
}

interface BeMoveAnimation {
  type: 'move';
  player_id: string;
  from_position: number;
  to_position: number;
  speed: 'normal' | 'fast';
  reason: 'dice' | 'card' | 'teleport' | 'jail';
}

interface BeShowCardAnimation {
  type: 'show_card';
  card: BeActiveCard;
}

interface BeWaitForPlayerAnimation {
  type: 'wait_for_player';
  interaction_id: string;
}

interface BeOpenDeedAnimation {
  type: 'open_deed';
  position: number;
}

type BeAnimationInstruction =
  | BeRollDiceAnimation
  | BeMoveAnimation
  | BeShowCardAnimation
  | BeWaitForPlayerAnimation
  | BeOpenDeedAnimation;

export interface BeGameState {
  game_id: string;
  session_code: string;
  status: string;
  game_mode?: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  winner_id?: string | null;
  viewer_id?: string;
  sudden_death_deadline_ms?: number | null;
  players: BePlayer[];
  turn: BeTurn;
  spaces: BeSpace[];
  auction?: BeAuction | null;
  trade?: BeTrade | null;
  active_card?: BeActiveCard | null;
  bankruptcy?: BeBankruptcy | null;
  bank_houses?: number;
  bank_hotels?: number;
  log?: BeLogEntry[];
  animation_timeline?: BeAnimationInstruction[];
}


// ─── Field mappers ────────────────────────────────────────────────────────────

function mapDice(d: BeDiceRoll | null | undefined): DiceRoll | null {
  if (!d) return null;
  return { die1: d.die1, die2: d.die2, isDoubles: d.is_doubles };
}

function mapPlayer(p: BePlayer): PlayerState {
  return {
    id: p.id,
    userId: p.user_id,
    displayName: p.display_name,
    token: p.token as TokenColor,
    avatarUrl: p.avatar_url ?? null,
    turnOrder: p.turn_order,
    position: p.position,
    balance: p.balance,
    getOutOfJailCards: p.get_out_of_jail_cards ?? 0,
    jailStatus: p.jail_status ? { attempts: p.jail_status.turns_remaining } : null,
    isBankrupt: p.is_bankrupt ?? false,
    isConnected: p.is_connected ?? true,
    afkStrikes: p.afk_strikes ?? 0,
    rating: p.rating ?? 800,
  };
}

function mapSpace(s: BeSpace): PropertyState {
  const hotel = s.has_hotel ?? false;
  // FE models houses as 0–4 with a separate hotel flag; BE keeps houses as the
  // building count and a has_hotel flag (a hotel implies 0 houses on the tile).
  const houses = hotel ? 0 : Math.min(4, Math.max(0, s.houses ?? 0));
  return {
    position: s.position,
    ownerId: s.owner_id ?? null,
    houses: houses as PropertyState['houses'],
    hotel,
    isMortgaged: s.is_mortgaged ?? false,
  };
}

function mapTurn(t: BeTurn): TurnState {
  return {
    phase: t.phase as TurnPhase,
    currentPlayerId: t.current_player_id,
    turnNumber: t.turn_number ?? 1,
    roundNumber: t.round_number ?? 1,
    diceRoll: mapDice(t.dice_roll),
    doublesStreak: t.doubles_streak ?? 0,
    // The backend re-rolls on doubles implicitly; surface it for UI affordances.
    extraTurn: (t.doubles_streak ?? 0) > 0,
    pendingBuyPosition: t.pending_buy_position ?? null,
    turnDeadlineMs: t.turn_deadline_ms ?? null,
  };
}

function mapOffer(o: BeTradeOffer | undefined): TradeOffer {
  return {
    money: o?.money ?? 0,
    positions: o?.positions ? [...o.positions] : [],
    getOutOfJailCards: o?.get_out_of_jail_cards ?? 0,
  };
}

function mapAuction(a: BeAuction | null | undefined): AuctionState | null {
  if (!a) return null;
  return {
    target: { kind: AuctionTargetKind.PROPERTY, position: a.property_position },
    bids: (a.bids ?? []).map((b) => ({ playerId: b.player_id, amount: b.amount })),
    highestBid: a.highest_bid ?? 0,
    highestBidderId: a.highest_bidder_id ?? null,
    timeRemainingMs: a.time_remaining_ms ?? 0,
  };
}

function mapTrade(t: BeTrade | null | undefined): TradeState | null {
  if (!t) return null;
  return {
    id: t.id,
    proposerId: t.proposer_id,
    targetId: t.target_id,
    proposerOffer: mapOffer(t.proposer_offer),
    targetRequest: mapOffer(t.target_request),
    status: t.status as TradeStatus,
    expiresAt: t.expires_at,
  };
}

function mapTimeline(raw: BeAnimationInstruction[] | undefined): AnimationInstruction[] {
  if (!raw) return [];
  return raw.map((i): AnimationInstruction => {
    switch (i.type) {
      case 'roll_dice':
        return { type: 'roll_dice', playerId: i.player_id, die1: i.die1, die2: i.die2, isDoubles: i.is_doubles };
      case 'move':
        return {
          type: 'move',
          playerId: i.player_id,
          fromPosition: i.from_position,
          toPosition: i.to_position,
          speed: i.speed,
          reason: i.reason,
        };
      case 'show_card':
        return { type: 'show_card', card: mapActiveCard(i.card)! };
      case 'wait_for_player':
        return { type: 'wait_for_player', interactionId: i.interaction_id };
      case 'open_deed':
        return { type: 'open_deed', position: i.position };
    }
  });
}

function mapActiveCard(c: BeActiveCard | null | undefined): ActiveCard | null {
  if (!c) return null;
  // Effect shapes already share snake_case `type` discriminants with the FE enum,
  // so the effect passes through structurally; only top-level keys are renamed.
  return {
    id: c.id,
    kind: c.kind as CardKind,
    text: c.text,
    effect: c.effect as ActiveCard['effect'],
    drawerId: c.drawer_id,
  };
}

function mapBankruptcyToDebt(b: BeBankruptcy | null | undefined): DebtState | null {
  if (!b) return null;
  return {
    debtorId: b.debtor_id,
    creditorType: b.creditor_id ? DebtCreditorType.PLAYER : DebtCreditorType.BANK,
    creditorId: b.creditor_id ?? null,
    amount: b.amount_owed ?? 0,
  };
}

/**
 * Converts a raw backend event object (snake_case) to the FE GameEvent shape
 * (camelCase). The backend field names mirror the FE type names, just in
 * snake_case. We only remap the keys the FE actually reads; anything unknown
 * is left as-is via the spread.
 *
 * Returns undefined if there is no event or the type field is missing.
 */
function mapEvent(e: BeLogEntry): GameEvent | undefined {
  if (!e.type) return undefined;
  return {
    type:          e.type,
    playerId:      e.player_id      ?? undefined,
    playerName:    e.player_name    ?? undefined,
    playerToken:   e.player_token   ?? undefined,
    tileId:        e.tile_id        ?? undefined,
    opponentId:    e.opponent_id    ?? undefined,
    rolled:        e.rolled         ?? undefined,
    spent:         e.spent          ?? undefined,
    received:      e.received       ?? undefined,
    cardId:        e.card_id        ?? undefined,
    cardKind:      e.card_kind      ?? undefined,
    reason:        e.reason         ?? undefined,
    streak:        e.streak         ?? undefined,
    strikes:       e.strikes        ?? undefined,
    propertyName:  e.property_name  ?? undefined,
    position:      e.position       ?? undefined,
    cost:          e.cost           ?? undefined,
    refund:        e.refund         ?? undefined,
    amount:        e.amount         ?? undefined,
    accepted:      e.accepted       ?? undefined,
    proposerId:    e.proposer_id    ?? undefined,
    proposerName:  e.proposer_name  ?? undefined,
    targetId:      e.target_id      ?? undefined,
    targetName:    e.target_name    ?? undefined,
    debtorId:      e.debtor_id      ?? undefined,
    debtorName:    e.debtor_name    ?? undefined,
    winnerId:      e.winner_id      ?? undefined,
    winnerName:    e.winner_name    ?? undefined,
    winnerAmount:  e.winner_amount  ?? undefined,
    roundNumber:   e.round_number   ?? undefined,
    isDoubles:     e.is_doubles     ?? undefined,
    tradeId:       e.trade_id       ?? undefined,
    creditorId:    e.creditor_id    ?? undefined,
  } as unknown as GameEvent;
}

function mapLog(entries: BeLogEntry[] | undefined): LogEntry[] {
  if (!entries) return [];

  if (process.env.NODE_ENV === 'development') {
    const sample = entries.slice(0, 3);
    logger.debug(
      '[GameLog] raw entries (first 3):',
      {
        entries: sample.map((e) => ({
          kind:       e.kind,
          type:       e.type,
          playerName: e.player_name,
          playerToken: e.player_token,
          text:       e.text,
        })),
      },
    );
  }

  return entries.map((e) => ({
    id:          e.id,
    kind:        e.kind as LogKind,
    playerId:    e.player_id    ?? undefined,
    playerName:  e.player_name  ?? undefined,
    playerToken: (e.player_token ?? undefined) as TokenColor | undefined,
    text:        e.text         ?? undefined,
    stickerUrl:  e.sticker_url  ?? undefined,
    ts:          e.ts,
    event:       mapEvent(e),
  }));
}

// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * Resolve which player the local client is looking through. The BE broadcasts the same
 * frame to everyone and its `viewer_id` is unreliable (empty on the first/broadcast
 * frame), so we identify the viewer from the authenticated user id whenever we have it,
 * and only fall back to the BE-provided `viewer_id`.
 */
function resolveViewerPlayerId(state: BeGameState, viewerUserId?: string): string | null {
  if (viewerUserId) {
    const player = state.players.find((p) => p.user_id === viewerUserId);
    if (player) return player.id;
  }
  return state.viewer_id && state.viewer_id !== '' ? state.viewer_id : null;
}

function derivePermissions(state: BeGameState, viewerPlayerId: string | null): PlayerPermissions {
  // The BE broadcasts the current player's actions_available to all viewers in the
  // same frame, so we must gate every turn-specific action on viewer identity.
  // Auction bidding is the exception: all players can bid simultaneously.
  // viewerPlayerId is resolved from the authenticated user (see resolveViewerPlayerId);
  // a null viewer denies all turn-specific actions rather than inheriting the active
  // player's actions_available — which would expose Roll/End Turn to every client.
  const isCurrentPlayer =
    viewerPlayerId != null &&
    viewerPlayerId === state.turn.current_player_id;
  const a = isCurrentPlayer ? (state.turn.actions_available ?? {}) : {};
  const rawA = state.turn.actions_available ?? {};
  const inJail = state.turn.phase === TurnPhase.JAIL_DECISION;
  const viewerPlayer = state.players.find((p) => p.id === viewerPlayerId);
  const isViewerBankrupt = viewerPlayer?.is_bankrupt ?? false;
  return {
    canRoll: !!a.can_roll && !inJail,
    canEndTurn: !!a.can_end_turn,
    canBuyProperty: !!a.can_buy,
    canBuildHouse: !!a.can_build,
    canBuildHotel: !!a.can_build,
    canMortgage: !!a.can_mortgage,
    canUnmortgage: !!a.can_unmortgage,
    canSellProperty: false,
    canTrade: !!a.can_trade,
    canBidAuction: (!!rawA.can_bid || state.auction != null) && !isViewerBankrupt,
    canPayJailFine: !!a.can_pay_jail_fine,
    canUseJailCard: !!a.can_use_jail_card,
    canRollInJail: !!a.can_roll && inJail,
    canPayDebt: !!a.can_end_turn && state.turn.phase === TurnPhase.MUST_PAY_RENT,
    canDeclareBankruptcy: !!a.can_declare_bankruptcy,
    canSurrender: !!a.can_surrender,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

/** Translate a backend `game.state` payload into a frontend GameSnapshot. */
export function adaptGameStateFrame(payload: BeGameState, viewerUserId?: string): GameSnapshot {
  const viewerPlayerId = resolveViewerPlayerId(payload, viewerUserId);
  const game: GameState = {
    gameId: payload.game_id,
    sessionCode: payload.session_code,
    status: payload.status as GameStatus,
    gameMode: (payload.game_mode as GameMode | null) ?? GameMode.NORMAL,
    createdAt: payload.created_at,
    startedAt: payload.started_at ?? null,
    finishedAt: payload.finished_at ?? null,
    winnerId: payload.winner_id ?? null,
    viewerId: viewerPlayerId ?? '',
    suddenDeathDeadlineMs: payload.sudden_death_deadline_ms ?? null,
    players: payload.players.map(mapPlayer),
    turn: mapTurn(payload.turn),
    bank: {
      availableHouses: payload.bank_houses ?? 0,
      availableHotels: payload.bank_hotels ?? 0,
    },
    spaces: payload.spaces.map(mapSpace),
    debt: mapBankruptcyToDebt(payload.bankruptcy),
    auction: mapAuction(payload.auction),
    trade: mapTrade(payload.trade),
    activeCard: mapActiveCard(payload.active_card),
    // FE `bankruptcy` (the BANKRUPT_RESOLUTION marker) is represented via `debt` +
    // turn.phase; the dedicated field is unused on the server-authoritative path.
    bankruptcy: null,
    decks: { chance: [], communityChest: [], discardedChance: [], discardedCommunityChest: [] },
    log: mapLog(payload.log),
  };

  return {
    game,
    permissions: derivePermissions(payload, viewerPlayerId),
    animationTimeline: mapTimeline(payload.animation_timeline),
  };
}

/** A safe, empty snapshot for before the first server frame arrives. */
export function emptySnapshot(): GameSnapshot {
  const game: GameState = {
    gameId: '',
    sessionCode: '',
    status: GameStatus.LOBBY,
    gameMode: GameMode.NORMAL,
    createdAt: new Date(0).toISOString(),
    startedAt: null,
    finishedAt: null,
    winnerId: null,
    viewerId: '',
    suddenDeathDeadlineMs: null,
    players: [],
    turn: {
      phase: TurnPhase.PRE_ROLL,
      currentPlayerId: '',
      turnNumber: 0,
      roundNumber: 0,
      diceRoll: null,
      doublesStreak: 0,
      extraTurn: false,
      pendingBuyPosition: null,
      turnDeadlineMs: null,
    },
    bank: { availableHouses: 0, availableHotels: 0 },
    spaces: [],
    debt: null,
    auction: null,
    trade: null,
    activeCard: null,
    bankruptcy: null,
    decks: { chance: [], communityChest: [], discardedChance: [], discardedCommunityChest: [] },
    log: [],
  };
  return { game, permissions: EMPTY_PERMISSIONS, animationTimeline: [] };
}
