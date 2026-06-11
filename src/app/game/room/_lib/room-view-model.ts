import type { ChatMessage } from '@/features/chat/chat.types';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import type { WalkingPlayer } from '@/features/game-board/game-board.types';
import type { Player } from '@/features/player-panel/player-panel.schema';
import type { TradeBuilderData } from '../_components/FullOverlay';
import type { GameState, PlayerState } from '@/shared/protocol/game-state';
import type { SessionDetail } from '@/shared/protocol/session';
import type { WsChatEntry } from '@/stores/socket-store';
import type { WalkState } from '@/stores/ui-store';
import { getBoardConfig } from '@/shared/config/board-layout';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { TOKEN_COLORS, TOKEN_ORDER } from '@/shared/config/constants';
import { WalkingAnimationVariant } from '@/shared/protocol/animation';
import { TradeStatus } from '@/shared/protocol/game-state.enums';
import { resolveTokenShape } from '@/features/BoardTile/token-shapes';
import {
  toTradeAsset,
  toTradeCounterparty,
  toTradeParticipant,
  toTradePlayer,
} from './trade-mappers';
import {
  buildTradeFocusPositions,
  buildTradeSelectionTones,
  type TradeDraftState,
} from './trade-draft';
import { ActiveOverlay } from '../_components/FullOverlay';

export interface TradeParticipantsView {
  proposer: ReturnType<typeof toTradeParticipant> | null;
  target: ReturnType<typeof toTradeParticipant> | null;
}

export interface DeedSelectionView {
  pendingBuySpace: BoardSpace | null;
  isBuyDecisionForViewer: boolean;
  highlightedBoardPosition: number | null;
  deedPanelSpace: BoardSpace;
}

export function buildWaitingSidebarPlayers(session: SessionDetail | null): Player[] {
  return session?.members.map((member, index) => ({
    id: member.user_id,
    name: member.display_name,
    balance: 0,
    position: 0,
    token: TOKEN_ORDER[index % TOKEN_ORDER.length],
    ownedPositions: [],
    isActive: false,
    isBankrupt: false,
    inJail: false,
    rating: member.rating,
  })) ?? [];
}

export function buildWalkingPlayers(game: GameState, walkState: WalkState | null): WalkingPlayer[] {
  if (!walkState) return [];
  const player = game.players.find((item) => item.id === walkState.playerId);
  return [{
    id: walkState.playerId,
    currentPos: walkState.currentPos,
    tokenColor: player ? TOKEN_COLORS[player.token] : '#10182E',
    tokenShape: resolveTokenShape(game.gameId, player?.turnOrder ?? 0),
    variant: walkState.variant ?? WalkingAnimationVariant.NORMAL,
  }];
}

export function buildChatMessages(
  entries: WsChatEntry[],
  tokenByUserId: Map<string, PlayerState['token']>,
): ChatMessage[] {
  return entries.map((entry) => ({
    id: entry.id,
    kind: 'chat' as const,
    fromUserId: entry.from_user_id,
    author: entry.display_name,
    token: tokenByUserId.get(entry.from_user_id),
    text: entry.kind === 'sticker' ? `[sticker:${entry.sticker_url}]` : entry.text,
    ts: Date.parse(entry.ts),
  }));
}

export function buildTradeParticipants(game: GameState): TradeParticipantsView {
  const proposer = game.trade ? game.players.find((player) => player.id === game.trade?.proposerId) : null;
  const target = game.trade ? game.players.find((player) => player.id === game.trade?.targetId) : null;
  return {
    proposer: proposer ? toTradeParticipant(game, proposer) : null,
    target: target ? toTradeParticipant(game, target) : null,
  };
}

export function buildTradeBuilderData(
  game: GameState,
  viewerPlayer: PlayerState | null | undefined,
  tradeDraft: TradeDraftState,
): TradeBuilderData | null {
  if (!viewerPlayer) return null;
  const others = game.players
    .filter((player) => player.id !== viewerPlayer.id && !player.isBankrupt)
    .map((player) => toTradeCounterparty(game, player));
  const target = others.find((player) => player.id === tradeDraft.targetId) ?? null;
  return {
    me: toTradePlayer(viewerPlayer),
    others,
    target,
    offerAssets:   [...tradeDraft.givePositions].map((pos) => toTradeAsset(pos, game.gameMode)),
    requestAssets: [...tradeDraft.getPositions].map((pos) => toTradeAsset(pos, game.gameMode)),
    giveMoney: tradeDraft.giveMoney,
    getMoney: tradeDraft.getMoney,
    giveCards: tradeDraft.giveCards,
    getCards: tradeDraft.getCards,
  };
}

export function resolveDeedSelection(
  pendingBuyPosition: number | null,
  selectedTile: number | null,
  viewerPosition: number | undefined,
  isViewerTurn: boolean,
  gameMode: GameMode = GameMode.NORMAL,
): DeedSelectionView {
  const { spacesByPosition, startPosition } = getBoardConfig(gameMode);
  const pendingBuySpace        = pendingBuyPosition != null ? (spacesByPosition[pendingBuyPosition] ?? null) : null;
  const isBuyDecisionForViewer = Boolean(pendingBuySpace && isViewerTurn);
  const selectedBoardPosition  = selectedTile != null && spacesByPosition[selectedTile] ? selectedTile : null;
  const deedBrowsePosition     = selectedBoardPosition ?? pendingBuyPosition ?? viewerPosition ?? startPosition;
  const deedBrowseSpace        = spacesByPosition[deedBrowsePosition] ?? spacesByPosition[startPosition]!;
  const highlightedBoardPosition = isBuyDecisionForViewer ? pendingBuyPosition : deedBrowsePosition;
  return {
    pendingBuySpace,
    isBuyDecisionForViewer,
    highlightedBoardPosition,
    deedPanelSpace: isBuyDecisionForViewer && pendingBuySpace ? pendingBuySpace : deedBrowseSpace,
  };
}

export function buildBoardSelectionTones(
  activeOverlay: ActiveOverlay | null,
  tradeDraft: TradeDraftState,
  game: GameState,
) {
  if (activeOverlay === ActiveOverlay.TRADE_BUILDER) {
    return buildTradeSelectionTones(tradeDraft.givePositions, tradeDraft.getPositions);
  }
  if (game.trade && game.trade.status === TradeStatus.PENDING) {
    return buildTradeSelectionTones(
      new Set(game.trade.proposerOffer.positions),
      new Set(game.trade.targetRequest.positions),
    );
  }
  return undefined;
}

export function buildBoardFocusPositions(
  activeOverlay: ActiveOverlay | null,
  tradeDraft: TradeDraftState,
  game: GameState,
) {
  if (activeOverlay === ActiveOverlay.TRADE_BUILDER) {
    return buildTradeFocusPositions(tradeDraft.givePositions, tradeDraft.getPositions);
  }
  if (game.trade && game.trade.status === TradeStatus.PENDING) {
    return buildTradeFocusPositions(
      new Set(game.trade.proposerOffer.positions),
      new Set(game.trade.targetRequest.positions),
    );
  }
  return null;
}

export function resolveWinnerName(game: GameState): string | null {
  if (!game.winnerId) return null;
  return game.players.find((player) => player.id === game.winnerId)?.displayName ?? null;
}
