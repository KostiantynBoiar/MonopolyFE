import { BOARD_TILE_COLORS } from '@/features/BoardTile/boardTile.colors';

export interface BalanceDeltaEntry {
  id: number;
  amount: number;
}

export function BalanceDelta({
  entry,
  onDone,
}: {
  entry: BalanceDeltaEntry;
  onDone: () => void;
}) {
  const isGain = entry.amount > 0;
  return (
    <span
      className="pointer-events-none animate-balance-delta whitespace-nowrap font-mono text-sm font-black"
      style={{ color: isGain ? BOARD_TILE_COLORS.propertyGreen : BOARD_TILE_COLORS.propertyRed }}
      onAnimationEnd={onDone}
    >
      {isGain ? '+' : ''}{entry.amount.toLocaleString()} {isGain ? '▲' : '▼'}
    </span>
  );
}
