'use client';

import { useState } from 'react';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { DeedWindow } from '@/features/deed';
import { DiceWindow } from '@/features/dice';
import { createMockGameRoomSnapshot } from '@/shared/mocks/game-room.mock';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import { BOARD, getGridPos, getTileEdge } from '../board-data';
import { BoardTileFlavor, SpaceType } from '../game-board.enums';
import type { BoardContainerProps } from '../game-board.types';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '../game-board.colors';
import { BoardTile } from './BoardTile';

const BOARD_COLUMNS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';
const BOARD_ROWS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';
const MOCK_SNAPSHOT = createMockGameRoomSnapshot();
const MOCK_LOG = MOCK_SNAPSHOT.game.log;
const MOCK_DICE_ROLL = MOCK_SNAPSHOT.game.turn.diceRoll;
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

function ActionPanel() {
  return (
    <section className="grid h-full min-h-0 grid-cols-2 grid-rows-[1.15fr_1fr_1fr] gap-[3px]">
      <button
        type="button"
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

export function BoardContainer({ centerContent }: BoardContainerProps) {
  const [selectedPos, setSelectedPos] = useState(37);
  const selectedSpace = BOARD[selectedPos] ?? BOARD[0];

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
                    <DiceWindow diceRoll={MOCK_DICE_ROLL} />
                  </div>

                  <div className="col-span-4 col-start-3 row-span-2 min-h-0">
                    <ActionPanel />
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

        <aside
          className="flex min-h-[220px] flex-col justify-between p-6"
          style={{
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.35em]"
              style={{ color: BOARD_TILE_COLORS.altText }}
            >
              Future Player Panel
            </p>
            <p className="mt-3 font-display text-3xl font-semibold">
              Green side panel
            </p>
          </div>

          <p className="max-w-xs text-sm" style={{ color: BOARD_TILE_COLORS.altText }}>
            Reserved for player cards, balances, turn state, and quick actions.
          </p>
        </aside>
      </section>
    </div>
  );
}
