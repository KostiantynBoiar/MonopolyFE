'use client';

import { BoardTileFlavor, CornerVariant } from '../boardTile.enums';
import type { BoardTileProps } from '../boardTile.schema';
import { CornerTile } from './CornerTile';
import { JailTile } from './JailTile';
import { PropertyTile } from './PropertyTile';
import { SpecialTile } from './SpecialTile';

export function BoardTile(props: BoardTileProps) {
  if (props.flavor === BoardTileFlavor.CORNER) {
    return props.space.corner === CornerVariant.JAIL
      ? <JailTile {...props} />
      : <CornerTile {...props} />;
  }
  if (props.flavor === BoardTileFlavor.SPECIAL) return <SpecialTile {...props} />;
  return <PropertyTile {...props} />;
}
