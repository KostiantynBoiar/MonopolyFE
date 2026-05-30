import type { GameState, PropertyState } from '@/shared/protocol/game-state';
import { TokenColor, GameStatus, TurnPhase, LogKind } from '@/shared/protocol/game-state';

// ─── Board ownership snapshot (40 spaces) ────────────────────────────────────
// Positions that are never purchasable: 0,2,4,7,10,17,20,22,30,33,36,38

function blankSpaces(): PropertyState[] {
  return Array.from({ length: 40 }, (_, i) => ({
    position: i,
    ownerId: null,
    houses: 0 as const,
    hotel: false,
    isMortgaged: false,
  }));
}

function own(
  spaces: PropertyState[],
  positions: number[],
  ownerId: string,
  patch?: Partial<Pick<PropertyState, 'houses' | 'hotel' | 'isMortgaged'>>,
) {
  for (const pos of positions) {
    spaces[pos] = { ...spaces[pos], ownerId, ...patch };
  }
}

const SPACES = blankSpaces();

// Alice owns: Mediterranean (1), Baltic (3) — brown complete + 3 houses each
own(SPACES, [1, 3], 'alice', { houses: 3 });
// Alice owns: Oriental (6), Vermont (8), Connecticut (9) — cyan complete + 2 houses each
own(SPACES, [6, 8, 9], 'alice', { houses: 2 });
// Alice owns: Reading Railroad (5)
own(SPACES, [5], 'alice');

// Bob owns: St. Charles (11), States (13), Virginia (14) — pink complete, 1 house
own(SPACES, [11, 13, 14], 'bob', { houses: 1 });
// Bob owns: St. James (16), Tennessee (18), New York (19) — orange complete + hotel on New York
own(SPACES, [16, 18], 'bob');
own(SPACES, [19], 'bob', { hotel: true });
// Bob owns: Pennsylvania Railroad (15) — mortgaged
own(SPACES, [15], 'bob', { isMortgaged: true });

// Carol owns: Kentucky (21), Indiana (23), Illinois (24) — red complete, 4 houses
own(SPACES, [21, 23, 24], 'carol', { houses: 4 });
// Carol owns: B&O Railroad (25), Short Line (35)
own(SPACES, [25, 35], 'carol');
// Carol owns: Electric Company (12)
own(SPACES, [12], 'carol');

// Dave owns: Pacific (31), North Carolina (32) — green incomplete
own(SPACES, [31, 32], 'dave', { houses: 2 });
// Dave owns: Boardwalk (39), Park Place (37) — blue complete, hotel on Boardwalk
own(SPACES, [37], 'dave', { houses: 3 });
own(SPACES, [39], 'dave', { hotel: true });

// ─── Mock game state ──────────────────────────────────────────────────────────

export const MOCK_GAME_STATE: GameState = {
  gameId:      'gm_01HXYZ4ABCDEF',
  sessionCode: 'TYC-A7X2',
  status:      GameStatus.IN_PROGRESS,
  createdAt:   '2026-05-29T18:00:00Z',
  startedAt:   '2026-05-29T18:02:15Z',
  finishedAt:  null,
  winnerId:    null,
  viewerId:    'alice',

  players: [
    {
      id: 'alice', userId: 'usr_alice', displayName: 'Alice',
      token: TokenColor.BLUE, avatarUrl: null,
      turnOrder: 0, position: 9, balance: 1240,
      getOutOfJailCards: 0, jailStatus: null,
      isBankrupt: false, isConnected: true,
    },
    {
      id: 'bob', userId: 'usr_bob', displayName: 'Bob',
      token: TokenColor.RED, avatarUrl: null,
      turnOrder: 1, position: 10, balance: 580,
      getOutOfJailCards: 1, jailStatus: null,
      isBankrupt: false, isConnected: true,
    },
    {
      id: 'carol', userId: 'usr_carol', displayName: 'Carol',
      token: TokenColor.GREEN, avatarUrl: null,
      turnOrder: 2, position: 10, balance: 920,
      getOutOfJailCards: 0, jailStatus: { attempts: 2 },
      isBankrupt: false, isConnected: true,
    },
    {
      id: 'dave', userId: 'usr_dave', displayName: 'Dave',
      token: TokenColor.GOLD, avatarUrl: null,
      turnOrder: 3, position: 39, balance: 3100,
      getOutOfJailCards: 0, jailStatus: null,
      isBankrupt: false, isConnected: true,
    },
  ],

  turn: {
    phase: TurnPhase.PRE_ROLL,
    currentPlayerId: 'alice',
    turnNumber: 18,
    roundNumber: 5,
    diceRoll: null,
    doublesStreak: 0,
    extraTurn: false,
    actionsAvailable: {
      canRoll: true,
      canBuy: false,
      canBuild: false,
      canSellBuildings: false,
      canMortgage: true,
      canUnmortgage: true,
      canTrade: true,
      canEndTurn: false,
      canPayJailFine: false,
      canUseJailCard: false,
      canBid: false,
    },
  },

  bank: { availableHouses: 32, availableHotels: 12 },
  spaces: SPACES,
  debt: null,
  auction: null,
  trade: null,
  activeCard: null,
  bankruptcy: null,
  decks: {
    chance: [],
    communityChest: [],
    discardedChance: [],
    discardedCommunityChest: [],
  },

  log: [
    { id: 'log_001', kind: LogKind.EVENT, text: 'Round 4 complete.', ts: '2026-05-29T18:18:00Z' },
    { id: 'log_002', kind: LogKind.EVENT, text: 'Alice built a house on Connecticut Ave (M50).', ts: '2026-05-29T18:18:30Z' },
    { id: 'log_003', kind: LogKind.CHAT, playerId: 'bob', playerName: 'Bob', playerToken: TokenColor.RED,
      text: 'Nice hotel on New York 😏 good luck landing there', ts: '2026-05-29T18:18:45Z' },
    { id: 'log_004', kind: LogKind.EVENT, text: 'Carol rolled 4 + 4 = 8 (doubles). Moved to Community Chest.', ts: '2026-05-29T18:19:10Z' },
    { id: 'log_005', kind: LogKind.EVENT, text: 'Carol rolled 2 + 2 = 4 (doubles again). Moved to Income Tax.', ts: '2026-05-29T18:19:30Z' },
    { id: 'log_006', kind: LogKind.EVENT, text: 'Carol rolled 3 + 3 = 6 (three doubles in a row). Sent to Jail!', ts: '2026-05-29T18:19:50Z' },
    { id: 'log_007', kind: LogKind.STICKER, playerId: 'carol', playerName: 'Carol', playerToken: TokenColor.GREEN,
      text: '[sticker:/stickers/kolobki/012.tgs]', stickerUrl: '/stickers/kolobki/012.tgs', ts: '2026-05-29T18:19:55Z' },
    { id: 'log_008', kind: LogKind.EVENT, text: 'Dave rolled 5 + 2 = 7. Moved to Boardwalk.', ts: '2026-05-29T18:20:15Z' },
    { id: 'log_009', kind: LogKind.EVENT, text: 'Dave upgraded Boardwalk to a hotel (M200).', ts: '2026-05-29T18:20:25Z' },
    { id: 'log_010', kind: LogKind.CHAT, playerId: 'dave', playerName: 'Dave', playerToken: TokenColor.GOLD,
      text: 'Boardwalk hotel. come visit 🏨', ts: '2026-05-29T18:20:35Z' },
    { id: 'log_011', kind: LogKind.STICKER, playerId: 'alice', playerName: 'Alice', playerToken: TokenColor.BLUE,
      text: '[sticker:/stickers/kolobki/007.tgs]', stickerUrl: '/stickers/kolobki/007.tgs', ts: '2026-05-29T18:20:40Z' },
    { id: 'log_012', kind: LogKind.EVENT, text: 'Bob rolled 6 + 5 = 11. Moved to Illinois Ave (Carol).', ts: '2026-05-29T18:21:00Z' },
    { id: 'log_013', kind: LogKind.EVENT, text: 'Bob paid M660 rent to Carol.', ts: '2026-05-29T18:21:05Z' },
    { id: 'log_014', kind: LogKind.STICKER, playerId: 'bob', playerName: 'Bob', playerToken: TokenColor.RED,
      text: '[sticker:/stickers/kolobki/003.tgs]', stickerUrl: '/stickers/kolobki/003.tgs', ts: '2026-05-29T18:21:08Z' },
    { id: 'log_015', kind: LogKind.EVENT, text: "Round 5. Alice's turn.", ts: '2026-05-29T18:21:15Z' },
  ],
};

// ─── Derived UI helpers ───────────────────────────────────────────────────────

export function logToChatMessages(log: GameState['log']) {
  return log.map((entry) => ({
    id: entry.id,
    kind: entry.kind === LogKind.STICKER ? 'chat' as const : entry.kind,
    author: entry.playerName,
    token: entry.playerToken,
    text: entry.text,
    ts: new Date(entry.ts).getTime(),
  }));
}
