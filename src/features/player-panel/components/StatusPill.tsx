import type { ReactNode } from 'react';
import { BOARD_TILE_COLORS } from '@/features/board-tile/boardTile.colors';

export function StatusPill({
  children,
  backgroundColor,
  color = BOARD_TILE_COLORS.altText,
}: {
  children: ReactNode;
  backgroundColor: string;
  color?: string;
}) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
      style={{ backgroundColor, color }}
    >
      {children}
    </span>
  );
}
