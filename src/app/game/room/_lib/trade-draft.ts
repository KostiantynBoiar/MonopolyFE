import { BoardTileSelectionTone } from '@/features/game-board';
import type { GameState, PlayerState } from '@/shared/protocol/game-state';
import { getPlayerProperties } from '@/shared/protocol/selectors';
import { getSpaceOwnerId, isSpaceMortgaged } from './game-spaces';

export interface TradeDraftState {
  targetId: string | null;
  giveMoney: number;
  getMoney: number;
  giveCards: number;
  getCards: number;
  givePositions: Set<number>;
  getPositions: Set<number>;
}

export function createTradeDraftState(): TradeDraftState {
  return {
    targetId: null,
    giveMoney: 0,
    getMoney: 0,
    giveCards: 0,
    getCards: 0,
    givePositions: new Set(),
    getPositions: new Set(),
  };
}

export function withToggledPosition(source: Set<number>, position: number): Set<number> {
  const next = new Set(source);
  if (next.has(position)) {
    next.delete(position);
    return next;
  }

  next.add(position);
  return next;
}

export function resolveTradeTargetIdFromPosition(
  game: GameState,
  viewerPlayerId: string | null,
  position: number,
  currentTargetId: string | null,
): string | null {
  const ownerId = getSpaceOwnerId(game, position);
  if (ownerId && ownerId !== viewerPlayerId) {
    const owner = game.players.find((player) => player.id === ownerId);
    return owner && !owner.isBankrupt ? owner.id : null;
  }

  const playersOnPosition = game.players.filter(
    (player) => player.position === position && player.id !== viewerPlayerId && !player.isBankrupt,
  );
  if (playersOnPosition.length === 1) {
    return playersOnPosition[0].id;
  }

  return playersOnPosition.find((player) => player.id === currentTargetId)?.id ?? null;
}

export function buildTradeSelectionTones(
  givePositions: Set<number>,
  getPositions: Set<number>,
): Partial<Record<number, BoardTileSelectionTone>> {
  const tones: Partial<Record<number, BoardTileSelectionTone>> = {};

  for (const position of givePositions) {
    tones[position] = BoardTileSelectionTone.TRADE_OFFER;
  }

  for (const position of getPositions) {
    tones[position] = BoardTileSelectionTone.TRADE_REQUEST;
  }

  return tones;
}

export function buildTradeFocusPositions(
  givePositions: Set<number>,
  getPositions: Set<number>,
): Set<number> | null {
  const positions = new Set([...givePositions, ...getPositions]);
  return positions.size > 0 ? positions : null;
}

function setsAreEqual(left: Set<number>, right: Set<number>): boolean {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
}

export function normalizeTradeDraft(
  draft: TradeDraftState,
  game: GameState,
  viewerPlayer: PlayerState | null,
): TradeDraftState {
  if (!viewerPlayer) {
    return createTradeDraftState();
  }

  const ownedByViewer = new Set(getPlayerProperties(game, viewerPlayer.id).map((space) => space.position));
  const nextGivePositions = new Set(
    [...draft.givePositions].filter(
      (position) => ownedByViewer.has(position) && !isSpaceMortgaged(game, position),
    ),
  );

  const target = draft.targetId
    ? game.players.find((player) => player.id === draft.targetId && !player.isBankrupt)
    : null;
  const ownedByTarget = target
    ? new Set(getPlayerProperties(game, target.id).map((space) => space.position))
    : new Set<number>();
  const nextGetPositions = new Set(
    [...draft.getPositions].filter(
      (position) => ownedByTarget.has(position) && !isSpaceMortgaged(game, position),
    ),
  );

  const nextGiveMoney = Math.min(draft.giveMoney, viewerPlayer.balance);
  const nextGiveCards = Math.min(draft.giveCards, viewerPlayer.getOutOfJailCards);
  const nextGetMoney = target ? Math.min(draft.getMoney, target.balance) : 0;
  const nextGetCards = target ? Math.min(draft.getCards, target.getOutOfJailCards) : 0;

  const isUnchanged =
    draft.targetId === (target?.id ?? null) &&
    draft.giveMoney === nextGiveMoney &&
    draft.getMoney === nextGetMoney &&
    draft.giveCards === nextGiveCards &&
    draft.getCards === nextGetCards &&
    setsAreEqual(draft.givePositions, nextGivePositions) &&
    setsAreEqual(draft.getPositions, nextGetPositions);

  if (isUnchanged) {
    return draft;
  }

  return {
    targetId: target?.id ?? null,
    giveMoney: nextGiveMoney,
    getMoney: nextGetMoney,
    giveCards: nextGiveCards,
    getCards: nextGetCards,
    givePositions: nextGivePositions,
    getPositions: nextGetPositions,
  };
}
