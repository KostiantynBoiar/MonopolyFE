import { useTranslations } from 'next-intl';
import { BOARD, getGridPos, getTileEdge } from '@/shared/config/board-layout';
import { BoardTileFlavor, SpaceType } from '../game-board.enums';
import type { BoardContainerProps } from '../game-board.types';
import { GAME_BOARD_COLORS } from '../game-board.colors';
import { BoardTile } from './BoardTile';
import { PlayerPanel } from './PlayerPanel';

const BOARD_COLUMNS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';
const BOARD_ROWS = 'calc(var(--board-unit) * 2) repeat(9, var(--board-unit)) calc(var(--board-unit) * 2)';

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

// ─── BoardContainer ───────────────────────────────────────────────────────────

export function BoardContainer({
  centerContent,
  centerSlots,
  spaces,
  players,
  walkingPlayers,
  sidebarPlayers,
  selectedPosition,
  onSelectPosition,
  focusPosition,
  viewerId,
  createdAt,
  onSurrender,
}: BoardContainerProps) {
  const t = useTranslations('Board');
  const boardSpaces = spaces ?? [];
  const boardPlayers = players ?? [];
  const hasSidebar = sidebarPlayers !== undefined;
  const ownershipByPosition = new Map(boardSpaces.map((space) => [space.position, space]));
  const colorById = new Map(boardPlayers.map((p) => [p.id, p.tokenColor]));
  const playersByPosition = new Map<number, typeof boardPlayers>();

  const walkingIds = new Set((walkingPlayers ?? []).map((player) => player.id));

  for (const player of boardPlayers) {
    if (walkingIds.has(player.id)) {
      continue;
    }

    if (player.isBankrupt) {
      continue;
    }

    playersByPosition.set(player.position, [...(playersByPosition.get(player.position) ?? []), player]);
  }

  for (const player of walkingPlayers ?? []) {
    const boardPlayer = {
      id: player.id,
      position: player.currentPos,
      tokenColor: player.tokenColor,
      isBankrupt: false,
      avatarUrl: null,
    };
    playersByPosition.set(player.currentPos, [...(playersByPosition.get(player.currentPos) ?? []), boardPlayer]);
  }
  // ─── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-screen w-full items-center justify-center p-[4px]"
      style={{ backgroundColor: GAME_BOARD_COLORS.ink }}
    >
      <section
        className={`grid h-full w-full gap-[4px] overflow-hidden${hasSidebar ? ' md:grid-cols-[minmax(0,1fr)_320px]' : ''}`}
        aria-label={t('boardLabel')}
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
                    style={{ gridColumn: col + 1, gridRow: row + 1 }}
                  >
                    <BoardTile
                      space={space}
                      edge={getTileEdge(space.pos)}
                      flavor={getTileFlavor(space.type)}
                      ownership={ownershipByPosition.get(space.pos) ?? null}
                      ownerColor={(() => {
                        const own = ownershipByPosition.get(space.pos);
                        return own?.ownerId ? colorById.get(own.ownerId) : undefined;
                      })()}
                      players={playersByPosition.get(space.pos) ?? []}
                      walkingPlayerIds={walkingIds}
                      isSelected={selectedPosition === space.pos}
                      isDimmed={focusPosition != null && space.pos !== focusPosition}
                      onSelect={onSelectPosition ? () => onSelectPosition(space.pos) : undefined}
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
                  {centerContent ? (
                    <div className="h-full w-full overflow-hidden rounded-[12px]">
                      {centerContent}
                    </div>
                  ) : (
                    <div className="grid h-full w-full grid-cols-6 grid-rows-5 gap-[6px]">
                      <div className="col-span-2 row-span-2 min-h-0">
                        {centerSlots?.dice}
                      </div>

                      <div className="col-span-4 col-start-3 row-span-2 min-h-0">
                        {centerSlots?.actions}
                      </div>

                      <div className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0">
                        {centerSlots?.chat}
                      </div>

                      <div className="col-span-2 col-start-5 row-span-3 row-start-3 min-h-0">
                        {centerSlots?.deed}
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
            <PlayerPanel
              players={sidebarPlayers}
              viewerId={viewerId}
              createdAt={createdAt}
              onSurrender={onSurrender}
            />
          </div>
        )}
      </section>
    </div>
  );
}
