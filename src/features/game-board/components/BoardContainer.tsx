'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BOARD, getGridPos, getTileEdge, getTileOuterEdgePct } from '@/shared/config/board-layout';
import { WalkingAnimationVariant } from '@/shared/protocol/animation';
import { WALK_STEP_DURATION_MS, CARD_WALK_STEP_DURATION_MS, JAIL_CORNER_DRAG_DURATION_MS } from '@/shared/config/constants';
import { BoardTileFlavor, SpaceType } from '../game-board.enums';
import type { BoardContainerProps, WalkingPlayer } from '../game-board.types';
import { GAME_BOARD_COLORS } from '../game-board.colors';
import { BoardTile } from './BoardTile';
import { PlayerPanel } from './PlayerPanel';

// ─── Animated overlay token ───────────────────────────────────────────────────

const ANIM = {
  [WalkingAnimationVariant.NORMAL]: { easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)', duration: WALK_STEP_DURATION_MS },
  [WalkingAnimationVariant.FAST]: { easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)', duration: CARD_WALK_STEP_DURATION_MS },
  [WalkingAnimationVariant.DRAG]: { easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)', duration: JAIL_CORNER_DRAG_DURATION_MS },
} as const;

function AnimatedBoardToken({
  id,
  currentPos,
  tokenColor,
  variant = WalkingAnimationVariant.NORMAL,
}: WalkingPlayer) {
  const prevPosRef            = useRef(currentPos);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const prev  = prevPosRef.current;
    const delta = Math.abs(currentPos - prev);
    if (variant !== WalkingAnimationVariant.DRAG && delta > 20) {
      // Wraparound — teleport without transition, then re-enable for next step
      setAnimate(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(true);
    }
    prevPosRef.current = currentPos;
  }, [currentPos]);

  const { x, y }             = getTileOuterEdgePct(currentPos);
  const { easing, duration } = ANIM[variant];

  return (
    <div
      key={id}
      aria-hidden="true"
      style={{
        position:        'absolute',
        left:            `${x}%`,
        top:             `${y}%`,
        transform:       'translate(-50%, -50%)',
        transition:      animate
          ? `left ${duration}ms ${easing}, top ${duration}ms ${easing}`
          : 'none',
        width:           'clamp(20px, 2.6vmin, 38px)',
        aspectRatio:     '1 / 1',
        borderRadius:    '50%',
        backgroundColor: tokenColor,
        outline:         '2.5px solid rgba(255,255,255,0.94)',
        outlineOffset:   '0px',
        boxShadow:       '0 0 0 1.5px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.65)',
        zIndex:          60,
        pointerEvents:   'none',
        willChange:      'left, top',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
  tileSelectionTones,
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
  // ownerId → token color, so each owned tile can show its owner's marker.
  const colorByPlayerId = new Map(boardPlayers.map((player) => [player.id, player.tokenColor]));
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
              className="relative grid h-full w-full"
              style={{
                ['--board-unit' as string]: 'calc((100% - 24px) / 13)',
                ['--board-tile-width' as string]: 'var(--board-unit)',
                ['--board-corner-size' as string]: 'calc(var(--board-unit) * 2)',
                ['--board-edge-depth' as string]: 'calc(var(--board-unit) * 2)',
                gridTemplateColumns: BOARD_COLUMNS,
                gridTemplateRows: BOARD_ROWS,
                gap: '2px',
                backgroundColor: GAME_BOARD_COLORS.ink,
              }}
            >
              {BOARD.map((space) => {
                const { col, row } = getGridPos(space.pos);
                const ownership = ownershipByPosition.get(space.pos) ?? null;
                const ownerColor = ownership?.ownerId
                  ? colorByPlayerId.get(ownership.ownerId) ?? null
                  : null;

                return (
                  <div
                    key={space.pos}
                    style={{ gridColumn: col + 1, gridRow: row + 1 }}
                  >
                    <BoardTile
                      space={space}
                      edge={getTileEdge(space.pos)}
                      flavor={getTileFlavor(space.type)}
                      ownership={ownership}
                      ownerColor={ownerColor}
                      players={playersByPosition.get(space.pos) ?? []}
                      walkingPlayerIds={walkingIds}
                      isSelected={selectedPosition === space.pos}
                      selectionTone={tileSelectionTones?.[space.pos] ?? null}
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
                <div className="relative z-10 h-full w-full" style={{ padding: 'clamp(5px,0.85vmin,10px)' }}>
                  {centerContent ? (
                    <div className="h-full w-full overflow-hidden rounded-[12px]">
                      {centerContent}
                    </div>
                  ) : (
                    <div className="grid h-full w-full grid-cols-6 grid-rows-5" style={{ gap: 'clamp(3px,0.5vmin,6px)' }}>
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

              {/* Animated overlay tokens for walking players */}
              {(walkingPlayers ?? []).map((player) => (
                <AnimatedBoardToken key={player.id} {...player} />
              ))}
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
