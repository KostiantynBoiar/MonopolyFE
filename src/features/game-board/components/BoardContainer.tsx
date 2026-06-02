'use client';

import { useEffect, useState } from 'react';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { DeedWindow } from '@/features/deed';
import { DiceWindow } from '@/features/dice';
import { TOKEN_COLORS } from '@/features/player-panel';
import { createMockGameRoomSnapshot } from '@/shared/mocks/game-room.mock';
import type { DiceRoll } from '@/shared/protocol/game-state';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import { playSfx, preloadSfx } from '@/shared/lib/sfx';
import { BOARD, getGridPos, getTileEdge } from '../board-data';
import { BoardTileFlavor, SpaceType } from '../game-board.enums';
import type { BoardContainerProps } from '../game-board.types';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor } from '../game-board.colors';
import { BoardTile } from './BoardTile';

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
}));
const MOCK_PANEL_PLAYERS = MOCK_SNAPSHOT.game.players;
const MOCK_CHAT_MESSAGES = [
  { id: 'c1', kind: 'chat' as const, author: 'Bob', token: TokenColor.RED, text: 'Need one more turn before I trade.', ts: Date.now() - 1000 * 60 * 8 },
  { id: 'c2', kind: 'chat' as const, author: 'Carol', token: TokenColor.GREEN, text: 'Auction that if you skip it.', ts: Date.now() - 1000 * 60 * 4 },
  { id: 'c3', kind: 'chat' as const, author: 'Dave', token: TokenColor.GOLD, text: 'No mercy on Boardwalk.', ts: Date.now() - 1000 * 60 * 2 },
];
const ACTION_ITEMS = [
  { id: 'end-turn', label: 'End Turn' },
  { id: 'manage', label: 'Manage' },
  { id: 'trade', label: 'Trade' },
  { id: 'view-properties', label: 'Properties' },
] as const;

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

interface ActionPanelProps {
  onRollDice: () => void;
}

function ActionPanel({ onRollDice }: ActionPanelProps) {
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

      {ACTION_ITEMS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="rounded-[12px] border px-2 py-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
          style={{
            backgroundColor: GAME_BOARD_COLORS.tile,
            borderColor: GAME_BOARD_COLORS.border,
            color: GAME_BOARD_COLORS.tileText,
          }}
        >
          {action.label}
        </button>
      ))}
    </section>
  );
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function getOwnedProperties(playerId: string, spaces: typeof MOCK_SPACES) {
  return spaces
    .filter((space) => space.ownerId === playerId)
    .map((space) => BOARD.find((boardSpace) => boardSpace.pos === space.position))
    .filter((space): space is NonNullable<typeof space> => Boolean(space));
}

interface PlayerPanelProps {
  currentPlayerId: string;
  spaces: typeof MOCK_SPACES;
}

function PlayerPanel({ currentPlayerId, spaces }: PlayerPanelProps) {
  const currentPlayer = MOCK_PANEL_PLAYERS.find((player) => player.id === currentPlayerId);

  return (
    <aside
      className="flex min-h-[220px] flex-col gap-4 rounded-[18px] border p-4"
      style={{
        backgroundColor: GAME_BOARD_COLORS.panel,
        borderColor: GAME_BOARD_COLORS.border,
        color: GAME_BOARD_COLORS.text,
      }}
    >
      <div
        className="rounded-[14px] border px-3 py-3"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor: BOARD_TILE_COLORS.propertyBlue,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]">
          Current Turn
        </p>
        <p className="mt-1 truncate font-display text-2xl font-semibold">
          {currentPlayer?.displayName ?? 'Unknown'}
        </p>
      </div>

      <div className="grid min-h-0 gap-3">
        {MOCK_PANEL_PLAYERS.map((player) => {
          const ownedProperties = getOwnedProperties(player.id, spaces);
          const isCurrent = player.id === currentPlayerId;

          return (
            <article
              key={player.id}
              className="grid gap-3 rounded-[14px] border px-3 py-3"
              style={{
                backgroundColor: isCurrent ? GAME_BOARD_COLORS.center : GAME_BOARD_COLORS.surface,
                borderColor: isCurrent ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.text,
              }}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm font-black"
                  style={{
                    backgroundColor: TOKEN_COLORS[player.token],
                    borderColor: BOARD_TILE_COLORS.altText,
                    color: BOARD_TILE_COLORS.altText,
                    boxShadow: '0 2px 6px rgba(0,0,0,.22)',
                  }}
                >
                  {player.id.replace(/\D/g, '') || player.displayName.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-display text-lg font-semibold leading-tight">
                      {player.displayName}
                    </p>
                    {isCurrent && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.12em]"
                        style={{
                          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
                          color: BOARD_TILE_COLORS.altText,
                        }}
                      >
                        Turn
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs font-semibold" style={{ color: GAME_BOARD_COLORS.muted }}>
                    ${player.balance}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-1" aria-label={`${player.displayName} owned properties`}>
                {ownedProperties.length > 0 ? (
                  ownedProperties.slice(0, 12).map((property) => (
                    <span
                      key={property.pos}
                      className="aspect-square rounded-[5px] border"
                      style={{
                        backgroundColor: getSpaceHeaderColor(property),
                        borderColor: BOARD_TILE_COLORS.altText,
                        boxShadow: '0 1px 3px rgba(0,0,0,.22)',
                      }}
                      title={property.name}
                    />
                  ))
                ) : (
                  <span className="col-span-6 text-[11px] font-semibold" style={{ color: GAME_BOARD_COLORS.muted }}>
                    No properties
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-auto rounded-[14px] border px-4 py-3 text-sm font-black uppercase tracking-[0.12em]"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyRed,
          borderColor: BOARD_TILE_COLORS.propertyRed,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        Surrender
      </button>
    </aside>
  );
}

export function BoardContainer({ centerContent, spaces, players }: BoardContainerProps) {
  const [selectedPos, setSelectedPos] = useState(37);
  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(MOCK_DICE_ROLL);
  const [diceRollId, setDiceRollId] = useState(0);
  const boardSpaces = spaces ?? MOCK_SPACES;
  const boardPlayers = players ?? MOCK_PLAYERS;
  const ownershipByPosition = new Map(boardSpaces.map((space) => [space.position, space]));
  const playersByPosition = new Map<number, typeof boardPlayers>();

  for (const player of boardPlayers) {
    if (player.isBankrupt) {
      continue;
    }

    playersByPosition.set(player.position, [...(playersByPosition.get(player.position) ?? []), player]);
  }
  const selectedSpace = BOARD[selectedPos] ?? BOARD[0];

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

  return (
    <div
      className="flex h-screen w-full items-center justify-center p-[4px]"
      style={{ backgroundColor: GAME_BOARD_COLORS.ink }}
    >
      <section
        className="grid h-full w-full gap-[4px] overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]"
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
                <div className="relative z-10 grid h-full w-full grid-cols-6 grid-rows-5 gap-[6px] p-[10px]">
                  <div className="col-span-2 row-span-2 min-h-0">
                    <DiceWindow diceRoll={diceRoll} rollId={diceRollId} />
                  </div>

                  <div className="col-span-4 col-start-3 row-span-2 min-h-0">
                    <ActionPanel onRollDice={handleRollDice} />
                  </div>

                  <div className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0">
                    <ChatWindow log={MOCK_LOG} initialMessages={MOCK_CHAT_MESSAGES} />
                  </div>

                  <div className="col-span-2 col-start-5 row-span-3 row-start-3 min-h-0">
                    <DeedWindow space={selectedSpace} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PlayerPanel currentPlayerId={MOCK_SNAPSHOT.game.turn.currentPlayerId} spaces={boardSpaces} />
      </section>
    </div>
  );
}
