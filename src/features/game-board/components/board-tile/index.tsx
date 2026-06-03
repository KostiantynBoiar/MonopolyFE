'use client';

import { BoardTileFlavor } from '../../game-board.enums';
import type { BoardTileProps } from '../../game-board.types';
import { CornerTile } from './CornerTile';
import { SpecialTile } from './SpecialTile';
import { PropertyTile } from './PropertyTile';

export function BoardTile(props: BoardTileProps) {
  if (props.flavor === BoardTileFlavor.CORNER) return <CornerTile {...props} />;
  if (props.flavor === BoardTileFlavor.SPECIAL) return <SpecialTile {...props} />;
  return <PropertyTile {...props} />;
}
