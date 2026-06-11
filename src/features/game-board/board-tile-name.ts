'use client';

import { useTranslations } from 'next-intl';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { useGameStore } from '@/stores/game-store';

export type TileNameResolver = (position: number) => string;

export function getBoardTileNameKey(position: number, gameMode: GameMode = GameMode.NORMAL): string {
  return `tiles.${gameMode}.p${position}`;
}

export function useBoardTileName(): TileNameResolver {
  const t = useTranslations('Board') as unknown as (key: string) => string;
  const gameMode = useGameStore((s) => s.snapshot.game.gameMode);
  return (position: number) => t(`tiles.${gameMode}.p${position}`);
}
