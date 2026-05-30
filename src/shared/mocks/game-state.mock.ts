import type { GameState, PropertyState, PlayerState } from '@/shared/protocol/game-state';
import { TokenColor, GameStatus, TurnPhase, LogKind } from '@/shared/protocol/game-state';
import type { GameSnapshot } from '@/shared/protocol/permissions';
import { computePermissions } from './compute-permissions';
import { makeEventEntry } from '@/shared/protocol/log';
import { GameEventType } from '@/shared/protocol/game-state';

const STARTING_BALANCE = 1500;

// Four players, all at GO with the standard starting bank. The viewer is Alice.
const PLAYER_SEED: ReadonlyArray<Pick<PlayerState, 'id' | 'userId' | 'displayName' | 'token'>> = [
  { id: 'alice', userId: 'usr_alice', displayName: 'Alice', token: TokenColor.BLUE },
  { id: 'bob',   userId: 'usr_bob',   displayName: 'Bob',   token: TokenColor.RED },
  { id: 'carol', userId: 'usr_carol', displayName: 'Carol', token: TokenColor.GREEN },
  { id: 'dave',  userId: 'usr_dave',  displayName: 'Dave',  token: TokenColor.GOLD },
];

/** A fresh, unplayed game: everyone on GO, full bank, nothing owned, Alice to roll. */
export function createNewGame(): GameState {
  const players: PlayerState[] = PLAYER_SEED.map((p, i) => ({
    ...p,
    avatarUrl:         null,
    turnOrder:         i,
    position:          0,
    balance:           STARTING_BALANCE,
    getOutOfJailCards: 0,
    jailStatus:        null,
    isBankrupt:        false,
    isConnected:       true,
  }));

  const spaces: PropertyState[] = Array.from({ length: 40 }, (_, i) => ({
    position:    i,
    ownerId:     null,
    houses:      0 as const,
    hotel:       false,
    isMortgaged: false,
  }));

  const now = new Date().toISOString();

  return {
    gameId:      `gm_${Date.now()}`,
    sessionCode: 'TYC-NEW1',
    status:      GameStatus.IN_PROGRESS,
    createdAt:   now,
    startedAt:   now,
    finishedAt:  null,
    winnerId:    null,
    viewerId:    'alice',
    players,
    turn: {
      phase:           TurnPhase.PRE_ROLL,
      currentPlayerId: 'alice',
      turnNumber:      1,
      roundNumber:     1,
      diceRoll:        null,
      doublesStreak:   0,
      extraTurn:       false,
    },
    bank:       { availableHouses: 32, availableHotels: 12 },
    spaces,
    debt:       null,
    auction:    null,
    trade:      null,
    activeCard: null,
    bankruptcy: null,
    decks: {
      chance:                  [],
      communityChest:          [],
      discardedChance:         [],
      discardedCommunityChest: [],
    },
    log: [
      { id: 'log_start', kind: LogKind.EVENT, text: 'New game started. Alice goes first.', ts: now },
      makeEventEntry({ type: GameEventType.TurnStarted, playerId: 'alice', playerName: 'Alice' }),
    ],
  };
}

/** Initial GameSnapshot for a fresh mock session. */
export const MOCK_SNAPSHOT: GameSnapshot = (() => {
  const game = createNewGame();
  return { game, permissions: computePermissions(game) };
})();
