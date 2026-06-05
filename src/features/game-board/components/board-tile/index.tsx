'use client';

import { BoardTileFlavor, CornerVariant } from '../../game-board.enums';
import type { BoardTileProps } from '../../game-board.types';
import { CornerTile } from './CornerTile';
import { JailTile } from './JailTile';
import { SpecialTile } from './SpecialTile';
import { PropertyTile } from './PropertyTile';

export function BoardTile(props: BoardTileProps) {
  if (props.flavor === BoardTileFlavor.CORNER) {
    return props.space.corner === CornerVariant.JAIL
      ? <JailTile {...props} />
      : <CornerTile {...props} />;
  }
  if (props.flavor === BoardTileFlavor.SPECIAL) return <SpecialTile {...props} />;
  return <PropertyTile {...props} />;
}
