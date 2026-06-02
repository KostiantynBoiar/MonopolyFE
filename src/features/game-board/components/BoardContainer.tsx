'use client';

import { useEffect, useState } from 'react';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { DeedWindow } from '@/features/deed';
import { DiceWindow } from '@/features/dice';
import { TOKEN_COLORS } from '@/features/player-panel';
import { ManagePropertiesOverlay } from '@/features/manage/ManagePropertiesOverlay';
import { TradeOverlay } from '@/features/trade/components/TradeOverlay';
import { JailOverlay } from '@/features/jail/JailOverlay';
import { DebtOverlay } from '@/features/bankruptcy/DebtOverlay';
import { AuctionOverlay } from '@/features/auction/components/AuctionOverlay';
import { CardFlipOverlay } from '@/features/card/components/CardFlipOverlay';
import { createMockGameRoomSnapshot } from '@/shared/mocks/game-room.mock';
import type { DiceRoll } from '@/shared/protocol/game-state';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import {
  AuctionTargetKind,
  CardKind,
  CardEffectType,
  TradeStatus,
  PropertyColor as GamePropertyColor,
} from '@/shared/protocol/game-state.enums';
import { playSfx, preloadSfx } from '@/shared/lib/sfx';
import { BOARD, getGridPos, getTileEdge } from '@/shared/config/board-layout';
import { BoardTileFlavor, SpaceType } from '../game-board.enums';
import type { BoardContainerProps } from '../game-board.types';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '../game-board.colors';
import { useActionButtons } from '../hooks';
import { BoardTile } from './BoardTile';
import { PlayerPanel } from './PlayerPanel';

const BOARD_COLUMNS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';
const BOARD_ROWS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';
const MOCK_SNAPSHOT = createMockGameRoomSnapshot();
const MOCK_LOG = MOCK_SNAPSHOT.game.log;
const MOCK_DICE_ROLL = MOCK_SNAPSHOT.game.turn.diceRoll;
const MOCK_SPACES = MOCK_SNAPSHOT.game.spaces;
const MOCK_PLAYERS = MOCK_SNAPSHOT.game.players.map((player) => ({
  id: player.id,
  position: player.position,
  tokenColor: TOKEN_COLORS[player.token],
  isBankrupt: player.isBankrupt,
  avatarUrl: player.avatarUrl,
}));
const MOCK_PANEL_PLAYERS = MOCK_SNAPSHOT.game.players;
const MOCK_CHAT_MESSAGES = [
  { id: 'c1', kind: 'chat' as const, author: 'Bob', token: TokenColor.RED, text: 'Need one more turn before I trade.', ts: Date.now() - 1000 * 60 * 8 },
  { id: 'c2', kind: 'chat' as const, author: 'Carol', token: TokenColor.GREEN, text: 'Auction that if you skip it.', ts: Date.now() - 1000 * 60 * 4 },
  { id: 'c3', kind: 'chat' as const, author: 'Dave', token: TokenColor.GOLD, text: 'No mercy on Boardwalk.', ts: Date.now() - 1000 * 60 * 2 },
];

const ACTION_ITEMS = [
  { id: 'end-turn', label: 'End Turn' },
  { id: 'manage',   label: 'Manage' },
  { id: 'trade',    label: 'Trade' },
  { id: 'view-properties', label: 'Properties' },
] as const;

// ─── Mock overlay data ────────────────────────────────────────────────────────

const MOCK_MANAGE_PROPERTIES = [
  {
    position: 1,
    name: 'Mediterranean Avenue',
    color: GamePropertyColor.BROWN,
    houses: 1 as const,
    hotel: false,
    isMortgaged: false,
    inMonopoly: true,
    rent: 10,
  },
  {
    position: 3,
    name: 'Baltic Avenue',
    color: GamePropertyColor.BROWN,
    houses: 0 as const,
    hotel: false,
    isMortgaged: false,
    inMonopoly: true,
    rent: 6,
  },
];

const MOCK_TRADE = {
  id: 'trade-mock-1',
  proposerId: 'p1',
  targetId: 'p2',
  proposerOffer: { money: 200, positions: [1], getOutOfJailCards: 1 },
  targetRequest: { money: 0, positions: [5], getOutOfJailCards: 0 },
  status: TradeStatus.PENDING,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

const MOCK_AUCTION_STATE = {
  target: { kind: AuctionTargetKind.PROPERTY, position: 6 } as const,
  bids: [
    { playerId: 'p1', amount: 120 },
    { playerId: 'p2', amount: 150 },
  ],
  highestBid: 150,
  highestBidderId: 'p2',
  timeRemainingMs: 18_000,
};

const MOCK_ACTIVE_CARD = {
  id: 'card-mock-1',
  kind: CardKind.CHANCE,
  text: 'Advance to Boardwalk.',
  effect: { type: CardEffectType.ADVANCE_TO, position: 39, collectGoBonus: false } as const,
  drawerId: 'p1',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTileFlavor(type: SpaceType): BoardTileFlavor {
  switch (type) {
    case SpaceType.CORNER:
      return BoardTileFlavor.CORNER;
    case SpaceType.CHANCE:
    case SpaceType.CHEST:
      return BoardTileFlavor.SPECIAL;
    default:
      return BoardTileFlavor.PROPERTY;
  }
}

// ─── ActionPanel ─────────────────────────────────────────────────────────────

interface ActionPanelProps {
  onRollDice: () => void;
  onAction: (id: string) => void;
  activeAction: string | null;
}

function ActionPanel({ onRollDice, onAction, activeAction }: ActionPanelProps) {
  return (
    <section className="grid h-full min-h-0 grid-cols-2 grid-rows-[1.15fr_1fr_1fr] gap-[3px]">
      <button
        type="button"
        onClick={onRollDice}
        className="col-span-2 rounded-[12px] border px-3 py-3 text-sm font-black uppercase tracking-[0.12em]"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyYellow,
          borderColor: BOARD_TILE_COLORS.propertyOrange,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        Roll Dice
      </button>

      {ACTION_ITEMS.map((action) => {
        const isActive = activeAction === action.id;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action.id)}
            className="rounded-[12px] border px-2 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors"
            style={{
              backgroundColor: isActive ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.tile,
              borderColor: isActive ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.border,
              color: isActive ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.tileText,
            }}
          >
            {action.label}
          </button>
        );
      })}
    </section>
  );
}

// ─── Dice helpers ────────────────────────────────────────────────────────────

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

// ─── BoardContainer ───────────────────────────────────────────────────────────

export function BoardContainer({ centerContent, spaces, players, sidebarPlayers }: BoardContainerProps) {
  const [selectedPos, setSelectedPos] = useState(37);
  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(MOCK_DICE_ROLL);
  const [diceRollId, setDiceRollId] = useState(0);
  const boardSpaces = spaces ?? MOCK_SPACES;
  const boardPlayers = players ?? MOCK_PLAYERS;
  const hasSidebar = sidebarPlayers !== undefined;
  const ownershipByPosition = new Map(boardSpaces.map((space) => [space.position, space]));
  const playersByPosition = new Map<number, typeof boardPlayers>();
  const { activeOverlay, handleAction, closeOverlay } = useActionButtons();

  for (const player of boardPlayers) {
    if (player.isBankrupt) {
      continue;
    }

    playersByPosition.set(player.position, [...(playersByPosition.get(player.position) ?? []), player]);
  }
  const selectedSpace = BOARD[selectedPos] ?? BOARD[0];

  // Decision mode: viewer is current player and there's a property to buy/auction.
  const isCurrentViewer = MOCK_SNAPSHOT.game.viewerId === MOCK_SNAPSHOT.game.turn.currentPlayerId;
  const pendingBuyPos   = MOCK_SNAPSHOT.game.turn.pendingBuyPosition;
  const decisionSpace   = (isCurrentViewer && pendingBuyPos !== null) ? (BOARD[pendingBuyPos] ?? null) : null;

  useEffect(() => {
    preloadSfx('dice_roll');
  }, []);

  function handleRollDice() {
    const die1 = rollDie();
    const die2 = rollDie();

    playSfx('dice_roll');
    setDiceRoll({
      die1,
      die2,
      isDoubles: die1 === die2,
    });
    setDiceRollId((value) => value + 1);
  }

  // ─── Overlay rendering ──────────────────────────────────────────────────────

  const p1 = MOCK_PANEL_PLAYERS[0];
  const p2 = MOCK_PANEL_PLAYERS[1];
  const auctionPlayers = MOCK_PANEL_PLAYERS.map((p) => ({ id: p.id, name: p.displayName }));

  function renderOverlay() {
    switch (activeOverlay) {
      case 'manage':
        return (
          <ManagePropertiesOverlay
            properties={MOCK_MANAGE_PROPERTIES}
            canBuildHouse={true}
            canBuildHotel={false}
            canMortgage={true}
            canUnmortgage={true}
            onBuildHouse={() => {}}
            onBuildHotel={() => {}}
            onSellHouse={() => {}}
            onSellHotel={() => {}}
            onMortgage={() => {}}
            onUnmortgage={() => {}}
            onClose={closeOverlay}
          />
        );

      case 'trade':
        return (
          <TradeOverlay
            trade={MOCK_TRADE}
            proposer={{ id: p1.id, name: p1.displayName, token: p1.token, balance: p1.balance, ownedPositions: [1, 3] }}
            target={{ id: p2.id, name: p2.displayName, token: p2.token, balance: p2.balance, ownedPositions: [5] }}
            viewerId={MOCK_SNAPSHOT.game.viewerId}
            onAccept={closeOverlay}
            onReject={closeOverlay}
            onCounter={() => {}}
            onCancel={closeOverlay}
          />
        );

      case 'auction':
        return (
          <AuctionOverlay
            auctionState={MOCK_AUCTION_STATE}
            propertyName="Oriental Avenue"
            viewerId={MOCK_SNAPSHOT.game.viewerId}
            players={auctionPlayers}
            canBid={true}
            onBid={() => {}}
          />
        );

      case 'jail':
        return (
          <div className="flex h-full w-full items-center justify-center">
            <JailOverlay
              attempts={1}
              canPayFine={true}
              canUseCard={true}
              canRoll={true}
              diceRoll={null}
              isRolling={false}
              onPayFine={closeOverlay}
              onUseCard={closeOverlay}
              onRoll={() => {}}
            />
          </div>
        );

      case 'debt':
        return (
          <div className="flex h-full w-full items-center justify-center">
            <DebtOverlay
              amount={450}
              canPay={true}
              onPay={closeOverlay}
              onManage={() => {}}
              onBankrupt={closeOverlay}
            />
          </div>
        );

      case 'card':
        return (
          <CardFlipOverlay
            card={MOCK_ACTIVE_CARD}
            onProceed={closeOverlay}
          />
        );

      default:
        return null;
    }
  }

  const centerOverlay = renderOverlay();

  // ─── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-screen w-full items-center justify-center p-[4px]"
      style={{ backgroundColor: GAME_BOARD_COLORS.ink }}
    >
      <section
        className={`grid h-full w-full gap-[4px] overflow-hidden${hasSidebar ? ' md:grid-cols-[minmax(0,1fr)_320px]' : ''}`}
        aria-label="Tycoon board"
        style={{ backgroundColor: GAME_BOARD_COLORS.ink }}
      >
        <div className="flex min-h-0 min-w-0 items-center justify-center overflow-hidden">
          <div className="aspect-square h-full max-h-full w-full max-w-full">
            <div
              className="grid h-full w-full"
              style={{
                ['--board-unit' as string]: 'calc(100% / 13)',
                ['--board-tile-width' as string]: 'var(--board-unit)',
                ['--board-corner-size' as string]: 'calc(var(--board-unit) * 2)',
                ['--board-edge-depth' as string]: 'calc(var(--board-unit) * 2)',
                gridTemplateColumns: BOARD_COLUMNS,
                gridTemplateRows: BOARD_ROWS,
                backgroundColor: GAME_BOARD_COLORS.ink,
              }}
            >
              {BOARD.map((space) => {
                const { col, row } = getGridPos(space.pos);

                return (
                  <div
                    key={space.pos}
                    className="cursor-pointer"
                    onClick={() => setSelectedPos(space.pos)}
                    style={{ gridColumn: col + 1, gridRow: row + 1 }}
                  >
                    <BoardTile
                      space={space}
                      edge={getTileEdge(space.pos)}
                      flavor={getTileFlavor(space.type)}
                      ownership={ownershipByPosition.get(space.pos) ?? null}
                      players={playersByPosition.get(space.pos) ?? []}
                    />
                  </div>
                );
              })}

              <div
                className="relative flex items-center justify-center overflow-hidden text-center"
                style={{
                  gridColumn: '2 / 11',
                  gridRow: '2 / 11',
                  margin: '4px',
                  borderRadius: '16px',
                  border: `1px solid ${GAME_BOARD_COLORS.center}`,
                  backgroundColor: GAME_BOARD_COLORS.center,
                  color: GAME_BOARD_COLORS.text,
                }}
              >
                <div
                  className="absolute inset-[8px] rounded-[12px]"
                  style={{ backgroundColor: GAME_BOARD_COLORS.center }}
                />
                <div className="relative z-10 h-full w-full p-[10px]">
                  {centerOverlay ? (
                    <div className="h-full w-full overflow-hidden rounded-[12px]">
                      {centerOverlay}
                    </div>
                  ) : (
                    <div className="grid h-full w-full grid-cols-6 grid-rows-5 gap-[6px]">
                      <div className="col-span-2 row-span-2 min-h-0">
                        <DiceWindow diceRoll={diceRoll} rollId={diceRollId} />
                      </div>

                      <div className="col-span-4 col-start-3 row-span-2 min-h-0">
                        <ActionPanel
                          onRollDice={handleRollDice}
                          onAction={handleAction}
                          activeAction={activeOverlay}
                        />
                      </div>

                      <div className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0">
                        <ChatWindow log={MOCK_LOG} initialMessages={MOCK_CHAT_MESSAGES} />
                      </div>

                      <div className="col-span-2 col-start-5 row-span-3 row-start-3 min-h-0">
                        <DeedWindow
                          space={selectedSpace}
                          decisionSpace={decisionSpace}
                          onBuy={() => {}}
                          onAuction={() => {}}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasSidebar && (
          <div className="hidden min-h-0 md:block">
            <PlayerPanel players={sidebarPlayers} />
          </div>
        )}
      </section>
    </div>
  );
}
