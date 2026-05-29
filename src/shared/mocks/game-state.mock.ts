import type { GameState, SpaceOwnership } from '@/shared/protocol/game-state.schema';

// ─── Board ownership snapshot (40 spaces) ────────────────────────────────────
// Positions that are never purchasable: 0,2,4,7,10,17,20,22,30,33,36,38

function blankSpaces(): SpaceOwnership[] {
  return Array.from({ length: 40 }, (_, i) => ({
    position: i,
    ownerId: null,
    houses: 0,
    hasHotel: false,
    isMortgaged: false,
  }));
}

function own(
  spaces: SpaceOwnership[],
  positions: number[],
  ownerId: string,
  patch?: Partial<SpaceOwnership>,
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

// Bob owns: St. Charles (11), States (13), Virginia (14) — pink complete, unmortgaged, 1 house
own(SPACES, [11, 13, 14], 'bob', { houses: 1 });
// Bob owns: St. James (16), Tennessee (18), New York (19) — orange complete + hotel on New York
own(SPACES, [16, 18], 'bob');
own(SPACES, [19], 'bob', { hasHotel: true, houses: 0 });
// Bob owns: Pennsylvania Railroad (15) — mortgaged
own(SPACES, [15], 'bob', { isMortgaged: true });

// Carol owns: Kentucky (21), Indiana (23), Illinois (24) — red complete, 4 houses
own(SPACES, [21, 23, 24], 'carol', { houses: 4 });
// Carol owns: B&O Railroad (25), Short Line (35)
own(SPACES, [25, 35], 'carol');
// Carol owns: Electric Company (12)
own(SPACES, [12], 'carol');

// Dave owns: Pacific (31), North Carolina (32) — green incomplete (no hotel yet)
own(SPACES, [31, 32], 'dave', { houses: 2 });
// Dave owns: Boardwalk (39), Park Place (37) — blue complete, hotel on Boardwalk
own(SPACES, [37], 'dave', { houses: 3 });
own(SPACES, [39], 'dave', { hasHotel: true, houses: 0 });

// ─── Mock game state ──────────────────────────────────────────────────────────

export const MOCK_GAME_STATE: GameState = {
  gameId: 'gm_01HXYZ4ABCDEF',
  sessionCode: 'TYC-A7X2',

  status: 'in_progress',
  createdAt: '2026-05-29T18:00:00Z',
  startedAt: '2026-05-29T18:02:15Z',
  finishedAt: null,
  winnerId: null,

  viewerId: 'alice',  // the current client is Alice

  players: [
    {
      id: 'alice',
      userId: 'usr_alice',
      displayName: 'Alice',
      token: 'blue',
      avatarUrl: null,
      turnOrder: 0,
      position: 9,           // Connecticut Ave
      balance: 1240,
      ownedPositions: [1, 3, 5, 6, 8, 9],
      getOutOfJailCards: 0,
      jailStatus: null,
      isBankrupt: false,
      isConnected: true,
      netWorth: 2840,
    },
    {
      id: 'bob',
      userId: 'usr_bob',
      displayName: 'Bob',
      token: 'red',
      avatarUrl: null,
      turnOrder: 1,
      position: 10,          // Just Visiting (Jail corner — visiting, not jailed)
      balance: 580,
      ownedPositions: [11, 13, 14, 15, 16, 18, 19],
      getOutOfJailCards: 1,
      jailStatus: null,
      isBankrupt: false,
      isConnected: true,
      netWorth: 3180,
    },
    {
      id: 'carol',
      userId: 'usr_carol',
      displayName: 'Carol',
      token: 'green',
      avatarUrl: null,
      turnOrder: 2,
      position: 10,          // In Jail
      balance: 920,
      ownedPositions: [12, 21, 23, 24, 25, 35],
      getOutOfJailCards: 0,
      jailStatus: { turnsRemaining: 2 },
      isBankrupt: false,
      isConnected: true,
      netWorth: 2620,
    },
    {
      id: 'dave',
      userId: 'usr_dave',
      displayName: 'Dave',
      token: 'gold',
      avatarUrl: null,
      turnOrder: 3,
      position: 39,          // Boardwalk
      balance: 3100,
      ownedPositions: [31, 32, 37, 39],
      getOutOfJailCards: 0,
      jailStatus: null,
      isBankrupt: false,
      isConnected: true,
      netWorth: 5700,
    },
  ],

  turn: {
    phase: 'pre_roll',
    currentPlayerId: 'alice',
    turnNumber: 18,
    roundNumber: 5,
    diceRoll: null,
    doublesStreak: 0,
    actionsAvailable: {
      canRoll: true,
      canBuy: false,
      canBuild: false,
      canMortgage: true,
      canUnmortgage: true,
      canTrade: true,
      canEndTurn: false,
      canPayJailFine: false,
      canUseJailCard: false,
      canBid: false,
    },
  },

  spaces: SPACES,

  auction: null,
  trade: null,
  activeCard: null,

  log: [
    // Round 4 summary event
    {
      id: 'log_001',
      kind: 'event',
      text: 'Round 4 complete.',
      ts: '2026-05-29T18:18:00Z',
    },
    // Alice builds on cyan
    {
      id: 'log_002',
      kind: 'event',
      text: 'Alice built a house on Connecticut Ave (M50).',
      ts: '2026-05-29T18:18:30Z',
    },
    // Bob chat
    {
      id: 'log_003',
      kind: 'chat',
      playerId: 'bob',
      playerName: 'Bob',
      playerToken: 'red',
      text: 'Nice hotel on New York 😏 good luck landing there',
      ts: '2026-05-29T18:18:45Z',
    },
    // Carol rolled into jail
    {
      id: 'log_004',
      kind: 'event',
      text: 'Carol rolled 4 + 4 = 8 (doubles). Moved to Community Chest.',
      ts: '2026-05-29T18:19:10Z',
    },
    {
      id: 'log_005',
      kind: 'event',
      text: 'Carol rolled 2 + 2 = 4 (doubles again). Moved to Income Tax.',
      ts: '2026-05-29T18:19:30Z',
    },
    {
      id: 'log_006',
      kind: 'event',
      text: 'Carol rolled 3 + 3 = 6 (three doubles in a row). Sent to Jail!',
      ts: '2026-05-29T18:19:50Z',
    },
    // Carol sticker reaction
    {
      id: 'log_007',
      kind: 'sticker',
      playerId: 'carol',
      playerName: 'Carol',
      playerToken: 'green',
      text: '[sticker:/stickers/kolobki/012___.tgs]',
      stickerUrl: '/stickers/kolobki/012___.tgs',
      ts: '2026-05-29T18:19:55Z',
    },
    // Dave lands on Boardwalk (his own), builds hotel
    {
      id: 'log_008',
      kind: 'event',
      text: 'Dave rolled 5 + 2 = 7. Moved to Boardwalk.',
      ts: '2026-05-29T18:20:15Z',
    },
    {
      id: 'log_009',
      kind: 'event',
      text: 'Dave upgraded Boardwalk to a hotel (M200).',
      ts: '2026-05-29T18:20:25Z',
    },
    // Dave chat
    {
      id: 'log_010',
      kind: 'chat',
      playerId: 'dave',
      playerName: 'Dave',
      playerToken: 'gold',
      text: 'Boardwalk hotel. come visit 🏨',
      ts: '2026-05-29T18:20:35Z',
    },
    // Alice sticker reply
    {
      id: 'log_011',
      kind: 'sticker',
      playerId: 'alice',
      playerName: 'Alice',
      playerToken: 'blue',
      text: '[sticker:/stickers/kolobki/007___.tgs]',
      stickerUrl: '/stickers/kolobki/007___.tgs',
      ts: '2026-05-29T18:20:40Z',
    },
    // Bob pays rent on Carol's red group
    {
      id: 'log_012',
      kind: 'event',
      text: 'Bob rolled 6 + 5 = 11. Moved to Illinois Ave (Carol).',
      ts: '2026-05-29T18:21:00Z',
    },
    {
      id: 'log_013',
      kind: 'event',
      text: 'Bob paid M660 rent to Carol.',
      ts: '2026-05-29T18:21:05Z',
    },
    // Bob reacts
    {
      id: 'log_014',
      kind: 'sticker',
      playerId: 'bob',
      playerName: 'Bob',
      playerToken: 'red',
      text: '[sticker:/stickers/kolobki/003___.tgs]',
      stickerUrl: '/stickers/kolobki/003___.tgs',
      ts: '2026-05-29T18:21:08Z',
    },
    // Round 5 starts
    {
      id: 'log_015',
      kind: 'event',
      text: "Round 5. Alice's turn.",
      ts: '2026-05-29T18:21:15Z',
    },
  ],
};

// ─── Derived UI helpers ───────────────────────────────────────────────────────

/** Map log entries to the shape BoardCenterPanel expects */
export function logToChatMessages(log: GameState['log']) {
  return log.map((entry) => ({
    id: entry.id,
    kind: entry.kind === 'sticker' ? 'chat' as const : entry.kind,
    author: entry.playerName,
    token: entry.playerToken,
    text: entry.text,
    ts: new Date(entry.ts).getTime(),
  }));
}
