import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { SORTED_BUYABLE_SPACES } from '../player-panel.constants';

export function PropertyGroupGrid({ ownedPositions }: { ownedPositions: number[] }) {
  const owned = new Set(ownedPositions);
  return (
    <div
      className="shrink-0"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 8px)', gap: '2px' }}
    >
      {SORTED_BUYABLE_SPACES.map(({ pos, color }) => (
        <span
          key={pos}
          className="block rounded-[2px]"
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: owned.has(pos) ? color : GAME_BOARD_COLORS.border,
          }}
        />
      ))}
    </div>
  );
}
