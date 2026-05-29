'use client';

import type { ReactNode } from 'react';
import {
  BOARD,
  getGridPos,
  getTileEdge,
  type BoardSpace,
  type TileEdge,
  type BoardPlayer,
} from '../board-data';
import type { SpaceOwnership } from '@/shared/protocol/game-state.schema';
import { PropertyTile } from './PropertyTile';
import { CornerTile } from './CornerTile';
import { SpecialTile } from './SpecialTile';

// Tile pixel dimensions
const N = 56;  // narrow edge
const W = 91;  // wide edge (corner size)

const gridCols = `${W}px repeat(9, ${N}px) ${W}px`;
const gridRows = `${W}px repeat(9, ${N}px) ${W}px`;
const BOARD_PX = W * 2 + N * 9; // 686

// ─── Tile rendering ───────────────────────────────────────────────────────────

type TileContentProps = {
  space: BoardSpace;
  ownership?: SpaceOwnership;
  flipped?: boolean;
};

function TileContent({ space, ownership, flipped }: TileContentProps) {
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
        flipped={flipped}
      />
    );
  }
  return (
    <SpecialTile
      type={space.type}
      name={space.name}
      price={space.price}
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

// ─── Board ────────────────────────────────────────────────────────────────────

type MonopolyBoardProps = {
  scale?: number;
  centerContent?: ReactNode;
  spaces?: SpaceOwnership[];
  players?: BoardPlayer[];
};

export function MonopolyBoard({
  scale = 1,
  centerContent,
  spaces,
  players = [],
}: MonopolyBoardProps) {
  return (
    <div
      style={{
        width: BOARD_PX * scale,
        height: BOARD_PX * scale,
        fontSize: `${scale}rem`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gridTemplateRows: gridRows,
          width: BOARD_PX,
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
          const tokensHere = players.filter(
            (p) => p.position === space.pos && !p.isBankrupt,
          );

          return (
            <div
              key={space.pos}
              style={{ gridColumn: col + 1, gridRow: row + 1, position: 'relative' }}
            >
              <EdgeWrapper edge={edge}>
                <TileContent space={space} ownership={ownership} flipped={flipped} />
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
      </div>
    </div>
  );
}
