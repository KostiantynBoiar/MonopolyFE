import { TOKEN_COLORS } from '@/shared/config/constants';
import { TokenShape } from '@/features/BoardTile/token-shapes';
import { TokenShapeSvg } from '@/features/BoardTile/components/TokenShapeSvg';
import type { Player } from '../player-panel.schema';

export function PlayerAvatar({ player }: { player: Player }) {
  return (
    <TokenShapeSvg
      shape={player.tokenShape ?? TokenShape.CIRCLE}
      color={TOKEN_COLORS[player.token]}
      avatarUrl={player.avatarUrl}
      size="40px"
      className="shrink-0"
    />
  );
}
