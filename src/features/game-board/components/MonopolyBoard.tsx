'use client';

import { BOARD, getGridPos, getTileEdge, getTileCenter } from '../board-data';
import type { TileEdge } from '../game-board.enums';
import type { BoardPlayer, WalkingPlayer } from '../game-board.types';
import { PropertyTile } from './PropertyTile';
import { CornerTile } from './CornerTile';
import { SpecialTile } from './SpecialTile';
import { N, W, gridCols, gridRows, BOARD_W, BOARD_PX, WALK_STEP_DURATION_MS } from '@/shared/config/constants';
import type { TileContentProps, MonopolyBoardProps } from '../game-board.types';

// ─── Tile rendering ───────────────────────────────────────────────────────────

function TileContent({ space, ownership, ownerColor, flipped }: TileContentProps) {
  if (space.type === 'corner') {
    return <CornerTile variant={space.corner!} />;
  }
  if (space.type === 'property') {
    const houses = ownership?.hasHotel ? 5 : ((ownership?.houses ?? 0) as 0 | 1 | 2 | 3 | 4 | 5);
    return (
      <PropertyTile
        name={space.name}
        price={space.price!}
        color={space.color!}
        houseCount={houses}
        mortgaged={ownership?.isMortgaged}
        ownerColor={ownerColor}
        flipped={flipped}
      />
    );
  }
  return (
    <SpecialTile
      type={space.type}
      name={space.name}
      price={space.price}
      mortgaged={ownership?.isMortgaged}
      ownerColor={ownerColor}
      flipped={flipped}
    />
  );
}

// ─── Edge wrapper ─────────────────────────────────────────────────────────────

function EdgeWrapper({ edge, children }: { edge: TileEdge; children: React.ReactNode }) {
  if (edge === 'corner' || edge === 'bottom' || edge === 'top') {
    return <div className="h-full w-full">{children}</div>;
  }

  const rotation = edge === 'left' ? 'rotate(90deg)' : 'rotate(-90deg)';
  return (
    <div className="relative overflow-hidden" style={{ width: W, height: N }}>
      <div
        style={{
          position: 'absolute',
          width: N,
          height: W,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) ${rotation}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Player token dots ────────────────────────────────────────────────────────

function TokenDots({ players }: { players: BoardPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        padding: '3px 2px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {players.map((p) => (
        <div
          key={p.id}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: p.tokenColor,
            border: '1.5px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Walking token overlay ────────────────────────────────────────────────────

function WalkingTokenOverlay({ players }: { players: WalkingPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {players.map((p) => {
        const { x, y } = getTileCenter(p.currentPos);
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: p.tokenColor,
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
              transform: `translate(${x - 6}px, ${y - 6}px)`,
              transition: `transform ${WALK_STEP_DURATION_MS}ms ease-in-out`,
              willChange: 'transform',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

export function MonopolyBoard({
  scale = 1,
  centerContent,
  spaces,
  players = [],
  walkingPlayers = [],
}: MonopolyBoardProps) {
  const walkingIds = new Set(walkingPlayers.map((p) => p.id));

  return (
    <div
      style={{
        width: BOARD_W * scale,
        height: BOARD_PX * scale,
        fontSize: `${scale}rem`,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: gridCols,
          gridTemplateRows: gridRows,
          width: BOARD_W,
          height: BOARD_PX,
          transformOrigin: 'top left',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}
      >
        {BOARD.map((space) => {
          const { col, row } = getGridPos(space.pos);
          const edge = getTileEdge(space.pos);
          const flipped = edge === 'top';
          const ownership = spaces?.[space.pos];
          const ownerColor = ownership?.ownerId
            ? players.find((p) => p.id === ownership.ownerId)?.tokenColor
            : undefined;
          const tokensHere = players.filter(
            (p) => p.position === space.pos && !p.isBankrupt && !walkingIds.has(p.id),
          );

          return (
            <div
              key={space.pos}
              style={{ gridColumn: col + 1, gridRow: row + 1, position: 'relative' }}
            >
              <EdgeWrapper edge={edge}>
                <TileContent space={space} ownership={ownership} ownerColor={ownerColor} flipped={flipped} />
              </EdgeWrapper>
              <TokenDots players={tokensHere} />
            </div>
          );
        })}

        {/* Center */}
        <div
          style={{
            gridColumn: '2 / 11',
            gridRow: '2 / 11',
            overflow: 'hidden',
            background: '#d9e8d6',
            border: '1.5px solid #10182E',
          }}
        >
          {centerContent ?? (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="select-none font-display font-black uppercase tracking-widest text-red"
                style={{ fontSize: N * 0.85, letterSpacing: '0.05em' }}
              >
                TYCOON
              </span>
            </div>
          )}
        </div>

        <WalkingTokenOverlay players={walkingPlayers} />
      </div>
    </div>
  );
}
