'use client';

import type { ReactNode } from 'react';
import { BOARD, getGridPos, getTileEdge, type BoardSpace, type TileEdge } from '../board-data';
import { PropertyTile } from './PropertyTile';
import { CornerTile } from './CornerTile';
import { SpecialTile } from './SpecialTile';

// Tile pixel dimensions (half of Figma's 112/182)
const N = 56;  // narrow edge
const W = 91;  // wide edge (corner size)

const gridCols = `${W}px repeat(9, ${N}px) ${W}px`;
const gridRows = `${W}px repeat(9, ${N}px) ${W}px`;
const BOARD_PX = W * 2 + N * 9; // 686

function TileContent({ space }: { space: BoardSpace }) {
  if (space.type === 'corner') {
    return <CornerTile variant={space.corner!} />;
  }
  if (space.type === 'property') {
    return <PropertyTile name={space.name} price={space.price!} color={space.color!} />;
  }
  return <SpecialTile type={space.type} name={space.name} price={space.price} />;
}

function EdgeWrapper({ edge, children }: { edge: TileEdge; children: React.ReactNode }) {
  if (edge === 'corner' || edge === 'bottom') {
    return <div className="h-full w-full">{children}</div>;
  }

  if (edge === 'top') {
    // Cell is N×W (narrow×wide), rotate 180° in place
    return (
      <div className="h-full w-full" style={{ transform: 'rotate(180deg)' }}>
        {children}
      </div>
    );
  }

  // left / right columns: cell is W×N, content is N×W rotated
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

type MonopolyBoardProps = {
  scale?: number;
  centerContent?: ReactNode;
};

export function MonopolyBoard({ scale = 1, centerContent }: MonopolyBoardProps) {
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

          return (
            <div
              key={space.pos}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
              }}
            >
              <EdgeWrapper edge={edge}>
                <TileContent space={space} />
              </EdgeWrapper>
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
