'use client';

import { useTranslations } from 'next-intl';

export type TileNameResolver = (position: number) => string;

export function getBoardTileNameKey(position: number): string {
  return `tiles.p${position}`;
}

export function useBoardTileName(): TileNameResolver {
  const t = useTranslations('Board') as unknown as (key: string) => string;
  return (position: number) => {
    if (position < 0 || position > 39) return `#${position}`;
    return t(`tiles.p${position}`);
  };
}
