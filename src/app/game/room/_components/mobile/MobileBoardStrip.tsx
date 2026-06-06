'use client';

import { useEffect, useRef, useState } from 'react';
import { BOARD, getTileFlavor } from '@/shared/config/board-layout';
import { TileEdge } from '@/features/game-board/game-board.enums';
import { BoardTile } from '@/features/game-board/components/BoardTile';
import { TokenShapeSvg } from '@/features/game-board/components/TokenShapeSvg';
import type { BoardPlayer, WalkingPlayer } from '@/features/game-board/game-board.types';
import type { PropertyState } from '@/shared/protocol/game-state';
import type { BoardTileSelectionTone } from '@/features/game-board/game-board.enums';
import { WalkingAnimationVariant } from '@/shared/protocol/animation';
import { WALK_STEP_DURATION_MS, CARD_WALK_STEP_DURATION_MS, JAIL_CORNER_DRAG_DURATION_MS } from '@/shared/config/constants';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';

const ANIM = {
  [WalkingAnimationVariant.NORMAL]: { easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)', duration: WALK_STEP_DURATION_MS },
  [WalkingAnimationVariant.FAST]:   { easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)', duration: CARD_WALK_STEP_DURATION_MS },
  [WalkingAnimationVariant.DRAG]:   { easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)',    duration: JAIL_CORNER_DRAG_DURATION_MS },
} as const;

// Must match the strip tile width and gap-1 (4px) used in the layout below.
const TILE_W = 'clamp(60px, 17vw, 80px)';
const TILE_GAP = '4px';

function AnimatedMobileToken({ id, currentPos, tokenColor, tokenShape, variant = WalkingAnimationVariant.NORMAL }: WalkingPlayer) {
  const prevPosRef            = useRef(currentPos);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const prev  = prevPosRef.current;
    const delta = Math.abs(currentPos - prev);
    if (variant !== WalkingAnimationVariant.DRAG && delta > 20) {
      setAnimate(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(true);
    }
    prevPosRef.current = currentPos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPos]);

  const { easing, duration } = ANIM[variant];

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'absolute',
        left:          `calc(${currentPos} * (${TILE_W} + ${TILE_GAP}) + ${TILE_W} / 2)`,
        top:           '50%',
        transform:     'translate(-50%, -50%)',
        transition:    animate ? `left ${duration}ms ${easing}` : 'none',
        zIndex:        60,
        pointerEvents: 'none',
        willChange:    'left',
      }}
    >
      <TokenShapeSvg shape={tokenShape} color={tokenColor} size="clamp(18px, 3vmin, 28px)" />
    </div>
  );
}

interface MobileBoardStripProps {
  spaces: PropertyState[];
  players: BoardPlayer[];
  walkingPlayers?: WalkingPlayer[];
  selectedPosition: number | null;
  tileSelectionTones?: Partial<Record<number, BoardTileSelectionTone>>;
  onSelectPosition: (pos: number) => void;
}

export function MobileBoardStrip({
  spaces,
  players,
  walkingPlayers = [],
  selectedPosition,
  tileSelectionTones,
  onSelectPosition,
}: MobileBoardStripProps) {
  const tileRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const ownershipByPosition = new Map(spaces.map((s) => [s.position, s]));
  const colorByPlayerId = new Map(players.map((p) => [p.id, p.tokenColor]));
  const playersByPosition = new Map<number, BoardPlayer[]>();

  const walkingIds = new Set(walkingPlayers.map((wp) => wp.id));

  for (const player of players) {
    if (player.isBankrupt) continue;
    if (walkingIds.has(player.id)) continue;
    playersByPosition.set(player.position, [
      ...(playersByPosition.get(player.position) ?? []),
      player,
    ]);
  }

  const walkingPos = walkingPlayers[0]?.currentPos ?? null;

  // Auto-center selected tile (deed browse) or active walking position.
  useEffect(() => {
    const target = selectedPosition ?? null;
    if (target == null) return;
    tileRefs.current.get(target)?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [selectedPosition]);

  useEffect(() => {
    if (walkingPos == null) return;
    tileRefs.current.get(walkingPos)?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [walkingPos]);

  return (
    <div
      className="flex shrink-0 gap-1 overflow-x-auto py-1"
      style={{
        position: 'relative',
        isolation: 'isolate',
        scrollSnapType: 'x proximity',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        backgroundColor: GAME_BOARD_COLORS.ink,
        borderRadius: '14px',
        scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
      }}
    >
      {BOARD.map((space) => {
        const ownership = ownershipByPosition.get(space.pos) ?? null;
        const ownerColor = ownership?.ownerId
          ? (colorByPlayerId.get(ownership.ownerId) ?? null)
          : null;

        return (
          <div
            key={space.pos}
            ref={(el) => {
              if (el) tileRefs.current.set(space.pos, el);
              else tileRefs.current.delete(space.pos);
            }}
            style={{
              // Fixed tile dimensions for the horizontal strip.
              width: 'clamp(60px,17vw,80px)',
              height: '84px',
              flexShrink: 0,
              scrollSnapAlign: 'center',
              // Provide the board-unit CSS variable so PropertyTile's color band
              // resolves correctly. 100% in height context = tile height (84px);
              // 100% in padding context = tile width (clamp 60-80px).
              ['--board-unit' as string]: 'calc((100% - 24px) / 13)',
              ['--board-edge-depth' as string]: 'calc(var(--board-unit) * 2)',
            }}
          >
            <BoardTile
              space={space}
              edge={TileEdge.BOTTOM}
              flavor={getTileFlavor(space.type)}
              ownership={ownership}
              ownerColor={ownerColor ?? undefined}
              players={playersByPosition.get(space.pos) ?? []}
              isSelected={selectedPosition === space.pos}
              selectionTone={tileSelectionTones?.[space.pos] ?? null}
              onSelect={() => onSelectPosition(space.pos)}
            />
          </div>
        );
      })}

      {walkingPlayers.map((wp) => (
        <AnimatedMobileToken key={wp.id} {...wp} />
      ))}
    </div>
  );
}
