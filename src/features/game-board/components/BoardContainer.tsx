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
import { GAME_BOARD_COLORS } from '../game-board.colors';
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
  { id: 'end-turn', label: 'End Turn', icon: '↻' },
  { id: 'manage', label: 'Manage', icon: '⚙' },
  { id: 'trade', label: 'Trade', icon: '🤝' },
  { id: 'view-properties', label: 'View Properties', icon: '⌂' },
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
    <section className="grid h-full min-h-0 grid-cols-2 grid-rows-[1.15fr_1fr_1fr] gap-[6px]">
      <button
        type="button"
        className="col-span-2 rounded-[16px] border px-3 py-2 text-base font-black uppercase tracking-[0.04em]"
        style={{
          background: `linear-gradient(180deg, ${GAME_BOARD_COLORS.actionPrimary} 0%, ${GAME_BOARD_COLORS.actionPrimaryDark} 100%)`,
          borderColor: GAME_BOARD_COLORS.actionPrimaryBorder,
          color: GAME_BOARD_COLORS.actionSecondaryText,
          boxShadow: '0 3px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.45)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🎲</span>
          <span>Roll Dice</span>
        </span>
      </button>

      {ACTION_ITEMS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="rounded-[16px] border px-2 py-2 text-[13px] font-bold"
          style={{
            background: `linear-gradient(180deg, ${GAME_BOARD_COLORS.actionSecondary} 0%, #efe7de 100%)`,
            borderColor: GAME_BOARD_COLORS.actionSecondaryBorder,
            color: GAME_BOARD_COLORS.actionSecondaryText,
            boxShadow: '0 2px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.72)',
          }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="text-sm">{action.icon}</span>
            <span>{action.label}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

export function BoardContainer({ centerContent }: BoardContainerProps) {
  const [selectedPos, setSelectedPos] = useState(37);
  const selectedSpace = BOARD[selectedPos] ?? BOARD[0];

  return (
    <div className="flex h-screen w-full items-center justify-center p-[4px]">
      <section
        className="grid h-full w-full gap-[4px] overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]"
        aria-label="Tycoon board"
        style={{ backgroundColor: GAME_BOARD_COLORS.shell }}
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
                backgroundColor: GAME_BOARD_COLORS.boardFrame,
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
                  borderRadius: '12px',
                  backgroundColor: GAME_BOARD_COLORS.boardCenter,
                  color: GAME_BOARD_COLORS.boardCenterText,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at top, ${GAME_BOARD_COLORS.boardCenterGlow}, transparent 58%)`,
                  }}
                />
                <div className="relative z-10 grid h-full w-full grid-cols-6 grid-rows-5 gap-[4px] p-[4px]">
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
            backgroundColor: GAME_BOARD_COLORS.playerPanel,
            color: GAME_BOARD_COLORS.playerPanelText,
          }}
        >
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.35em]"
              style={{ color: GAME_BOARD_COLORS.playerPanelMuted }}
            >
              Future Player Panel
            </p>
            <p className="mt-3 font-display text-3xl font-semibold">
              Green side panel
            </p>
          </div>

          <p className="max-w-xs text-sm" style={{ color: GAME_BOARD_COLORS.playerPanelMuted }}>
            Reserved for player cards, balances, turn state, and quick actions.
          </p>
        </aside>
      </section>
    </div>
  );
}
