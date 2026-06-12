'use client';

import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, CORNER_COLOR_MAP } from '../boardTile.colors';
import { getTilePadding, shadowOnColor, TILE_SHADOW } from '../boardTile.constants';
import { CornerVariant } from '../boardTile.enums';
import type { BoardPlayer, BoardTileProps } from '../boardTile.schema';
import { GameMode } from '@/shared/protocol/game-state.enums';
import { TileBase } from './TileBase';
import { TokenShapeSvg } from './TokenShapeSvg';

// Jail sits at pos 10 (bottom-left corner): the board interior is up-and-right,
// so the barred cell occupies the top-right and the "Just Visiting" margin wraps
// the bottom-left L.
const JAIL_BG   = CORNER_COLOR_MAP[CornerVariant.JAIL];
const CELL_BG   = 'var(--board-tile)';
const BAR_COLOR = '#3A2A18';

function JailTokenRow({ players, size }: { players: BoardPlayer[]; size: string }) {
  return (
    <>
      {players.slice(0, 4).map((player) => (
        <TokenShapeSvg
          key={player.id}
          shape={player.tokenShape}
          color={player.tokenColor}
          avatarUrl={player.avatarUrl}
          size={size}
        />
      ))}
    </>
  );
}

export function JailTile({
  space,
  gameMode = GameMode.NORMAL,
  players,
  isSelected,
  selectionTone,
  isDimmed,
  onSelect,
}: BoardTileProps) {
  const tBoard = useTranslations('Board') as unknown as (key: string) => string;

  const jailed   = (players ?? []).filter((p) => p.inJail);
  const visiting = (players ?? []).filter((p) => !p.inJail);

  return (
    <TileBase
      isSelected={isSelected}
      selectionTone={selectionTone}
      isDimmed={isDimmed}
      onSelect={onSelect}
      className="h-full w-full rounded-[16px]"
      style={{
        backgroundColor: JAIL_BG,
        borderColor:     JAIL_BG,
        color:           BOARD_TILE_COLORS.altText,
        padding:         getTilePadding(),
        boxShadow:       TILE_SHADOW,
      }}
    >
      <span
        className="absolute bottom-[3%] left-[4%] z-[2] font-sans font-black uppercase leading-none"
        style={{
          fontSize:      'clamp(6px, 0.95vmin, 12px)',
          letterSpacing: '0.12em',
          color:         BOARD_TILE_COLORS.altText,
          textShadow:    shadowOnColor,
          opacity:       0.92,
        }}
      >
        {tBoard('justVisiting')}
      </span>

      {visiting.length > 0 && (
        <div className="absolute bottom-[16%] left-[6%] z-[3] flex max-w-[42%] flex-wrap items-end gap-[3px]">
          <JailTokenRow players={visiting} size="clamp(15px, 1.9vmin, 28px)" />
        </div>
      )}

      <div
        className="absolute right-[5%] top-[5%] z-[4] flex h-[56%] w-[56%] flex-col overflow-hidden rounded-[10px] border-2"
        style={{
          backgroundColor: CELL_BG,
          borderColor:     BAR_COLOR,
          boxShadow:       'inset 0 1px 3px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.25)',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-center"
          style={{ backgroundColor: BAR_COLOR, paddingBlock: 'clamp(2px, 0.35vmin, 5px)' }}
        >
          <span
            className="text-center font-sans font-black uppercase leading-none"
            style={{ fontSize: 'clamp(6px, 0.95vmin, 12px)', letterSpacing: '0.14em', color: CELL_BG }}
          >
            {tBoard('inJail')}
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 13%, ${BAR_COLOR} 13%, ${BAR_COLOR} 17%)`,
              opacity: 0.8,
            }}
          />
          <div className="relative z-[1] flex h-full flex-wrap items-center justify-center gap-[2px] p-[3px]">
            <JailTokenRow players={jailed} size="clamp(13px, 1.7vmin, 24px)" />
          </div>
        </div>
      </div>

      <span className="sr-only">{tBoard(`tiles.${gameMode}.p${space.pos}`)}</span>
    </TileBase>
  );
}
