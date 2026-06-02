import type { GameSnapshot } from '@/shared/protocol/permissions';
import { GameStatus, LogKind, TokenColor, TurnPhase } from '@/shared/protocol/game-state.enums';
import type { PropertyState } from '@/shared/protocol/game-state';
import { PRICE } from '@/shared/protocol/board-data';

const ISO_NOW = new Date().toISOString();

function buildSpaces(): PropertyState[] {
  const positions = Object.keys(PRICE).map(Number);
  return positions.map((position) => ({
    position,
    ownerId: null,
    houses: 0,
    hotel: false,
    isMortgaged: false,
  }));
}

export function createMockGameRoomSnapshot(): GameSnapshot {
  const viewerId = 'p1';
  const spaces = buildSpaces();

  const own = (position: number, ownerId: string, houses = 0, hotel = false) => {
    const i = spaces.findIndex((s) => s.position === position);
    if (i >= 0) {
      spaces[i] = {
        ...spaces[i],
        ownerId,
        houses: houses as 0 | 1 | 2 | 3 | 4,
        hotel,
      };
    }
  };

  own(1, 'p1', 1);
  own(3, 'p1', 0);
  own(5, 'p2');
  own(11, 'p2', 2);
  own(13, 'p2', 1);
  own(16, 'p3', 3);
  own(18, 'p3', 1);
  own(25, 'p4');
  own(28, 'p4');
  own(37, 'p4', 0, true);

  return {
    game: {
      gameId: 'debug-game-room',
      sessionCode: 'DEBUG1',
      status: GameStatus.IN_PROGRESS,
      createdAt: ISO_NOW,
      startedAt: ISO_NOW,
      finishedAt: null,
      winnerId: null,
      viewerId,
      players: [
        {
          id: 'p1',
          userId: 'u1',
          displayName: 'Alice',
          token: TokenColor.BLUE,
          avatarUrl: 'https://images.nationalgeographic.org/image/upload/t_edhub_resource_key_image/v1638882786/EducationHub/photos/sun-blasts-a-m66-flare.jpg',
          turnOrder: 0,
          position: 24,
          balance: 1460,
          getOutOfJailCards: 1,
          jailStatus: null,
          isBankrupt: false,
          isConnected: true,
        },
        {
          id: 'p2',
          userId: 'u2',
          displayName: 'Bob',
          token: TokenColor.RED,
          avatarUrl: null,
          turnOrder: 1,
          position: 11,
          balance: 1320,
          getOutOfJailCards: 0,
          jailStatus: null,
          isBankrupt: false,
          isConnected: true,
        },
        {
          id: 'p3',
          userId: 'u3',
          displayName: 'Carol',
          token: TokenColor.GREEN,
          avatarUrl: null,
          turnOrder: 2,
          position: 30,
          balance: 980,
          getOutOfJailCards: 0,
          jailStatus: { attempts: 1 },
          isBankrupt: false,
          isConnected: true,
        },
        {
          id: 'p4',
          userId: 'u4',
          displayName: 'Dave',
          token: TokenColor.GOLD,
          avatarUrl: null,
          turnOrder: 3,
          position: 37,
          balance: 1740,
          getOutOfJailCards: 0,
          jailStatus: null,
          isBankrupt: false,
          isConnected: true,
        },
      ],
      turn: {
        phase: TurnPhase.PRE_ROLL,
        currentPlayerId: 'p1',
        turnNumber: 12,
        roundNumber: 4,
        diceRoll: { die1: 4, die2: 3, isDoubles: false },
        doublesStreak: 0,
        extraTurn: false,
        pendingBuyPosition: null,
      },
      bank: {
        availableHouses: 26,
        availableHotels: 10,
      },
      spaces,
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
        {
          id: 'l1',
          kind: LogKind.EVENT,
          playerId: 'p1',
          playerName: 'Alice',
          playerToken: TokenColor.BLUE,
          text: 'Alice rolled 7 and moved to Illinois Avenue',
          ts: ISO_NOW,
        },
        {
          id: 'l2',
          kind: LogKind.EVENT,
          playerId: 'p2',
          playerName: 'Bob',
          playerToken: TokenColor.RED,
          text: 'Bob built 1 house on St. Charles Place',
          ts: ISO_NOW,
        },
      ],
    },
    permissions: {
      canRoll: true,
      canEndTurn: false,
      canBuyProperty: false,
      canBuildHouse: true,
      canBuildHotel: true,
      canMortgage: true,
      canUnmortgage: true,
      canSellProperty: false,
      canTrade: true,
      canBidAuction: false,
      canPayJailFine: false,
      canUseJailCard: false,
      canRollInJail: false,
      canPayDebt: false,
      canDeclareBankruptcy: false,
    },
  };
}
