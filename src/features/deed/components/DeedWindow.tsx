'use client';

import type { BoardSpace } from '@/features/game-board';
import { CornerVariant, SpaceType } from '@/features/game-board/game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor, getSpaceHeaderTextColor } from '@/features/game-board/game-board.colors';
import type { DeedInfo } from '../deed.types';
import { DeedSpaceType } from '../deed.enums';
import { getDeedInfo } from '../deed.utils';

interface DeedWindowProps {
  space: BoardSpace;
  onBuy?: () => void;
  onAuction?: () => void;
}

function getRentTitle(deed: DeedInfo) {
  switch (deed.spaceType) {
    case DeedSpaceType.RAILROAD:
      return 'Base Fare';
    case DeedSpaceType.UTILITY:
      return 'Usage';
    default:
      return 'Rent';
  }
}

function formatLabel(labelKey: string) {
  switch (labelKey) {
    case 'base':
      return 'Base Rent';
    case 'house1':
      return 'With 1 House';
    case 'house2':
      return 'With 2 Houses';
    case 'house3':
      return 'With 3 Houses';
    case 'house4':
      return 'With 4 Houses';
    case 'hotel':
      return 'With Hotel';
    case 'railroad1':
      return '1 Railroad';
    case 'railroad2':
      return '2 Railroads';
    case 'railroad3':
      return '3 Railroads';
    case 'railroad4':
      return '4 Railroads';
    case 'utility1':
      return '1 Utility';
    case 'utilityBoth':
      return '2 Utilities';
    default:
      return labelKey;
  }
}

function getCornerText(corner: CornerVariant | undefined) {
  switch (corner) {
    case CornerVariant.GO:
      return { eyebrow: 'Corner', title: 'Collect salary when you pass.', value: 'GO' };
    case CornerVariant.JAIL:
      return { eyebrow: 'Corner', title: 'Just visiting or locked in.', value: 'JAIL' };
    case CornerVariant.PARKING:
      return { eyebrow: 'Corner', title: 'Safe place to breathe.', value: 'FREE' };
    case CornerVariant.GOTO_JAIL:
      return { eyebrow: 'Corner', title: 'Do not pass GO.', value: 'JAIL' };
    default:
      return { eyebrow: 'Corner', title: 'Board anchor space.', value: 'CORNER' };
  }
}

function getSpecialText(space: BoardSpace) {
  switch (space.type) {
    case SpaceType.CHANCE:
      return 'Draw a chance card';
    case SpaceType.CHEST:
      return 'Open the community chest';
    case SpaceType.TAX:
      return `Pay the listed amount ($${space.price ?? 0})`;
    default:
      return 'Board space information';
  }
}

export function DeedWindow({ space, onBuy, onAuction }: DeedWindowProps) {
  const deed = getDeedInfo(space.pos);
  const isDeed = deed !== null;
  const headlineRent = deed?.rentRows[0]?.amount ?? (space.price != null ? `M${space.price}` : null);
  const cornerText = space.type === SpaceType.CORNER ? getCornerText(space.corner) : null;
  const specialText = !isDeed && !cornerText ? getSpecialText(space) : null;
  const isSpecialCard = Boolean(specialText);
  const showActions = isDeed && space.price != null;
  const nonDeedTitle = cornerText?.title ?? specialText ?? 'Board space information.';
  const headerColor = getSpaceHeaderColor(space);
  const headerTextColor = getSpaceHeaderTextColor(space);

  return (
    <section
      className="grid h-full min-h-0 gap-[3px] overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        gridTemplateRows: isDeed
          ? (showActions ? 'auto minmax(0,1fr) auto' : 'auto minmax(0,1fr)')
          : 'auto minmax(0,1fr)',
        backgroundColor: GAME_BOARD_COLORS.panel,
        borderColor: GAME_BOARD_COLORS.border,
        color: GAME_BOARD_COLORS.text,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[10px] border px-3 py-2 text-center"
        style={{
          backgroundColor: headerColor,
          borderColor: headerColor,
          color: headerTextColor,
        }}
      >
        <p className="font-display text-lg font-semibold uppercase tracking-[0.08em]">
          {space.name}
        </p>
      </div>

      <div
        className="grid min-h-0 rounded-[10px] border px-3 py-3"
        style={{
          gridTemplateRows:
            isDeed && deed ? 'auto auto minmax(0,1fr)' : isSpecialCard ? '1fr' : 'auto 1fr',
          backgroundColor: GAME_BOARD_COLORS.surface,
          borderColor: GAME_BOARD_COLORS.border,
        }}
      >
        {!isSpecialCard && (
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: GAME_BOARD_COLORS.text }}>
              {isDeed && deed ? getRentTitle(deed) : cornerText?.eyebrow ?? 'Status'}
            </p>
            <p className="mt-1 text-4xl font-black leading-none" style={{ color: GAME_BOARD_COLORS.tileText }}>
              {isDeed && headlineRent
                ? `$${headlineRent.replace(/^M/, '')}`
                : cornerText?.value ?? '--'}
            </p>
          </div>
        )}

        {isDeed && deed ? (
          <div
            className="my-[3px] h-px"
            style={{ backgroundColor: GAME_BOARD_COLORS.border }}
          />
        ) : null}

        {isDeed && deed ? (
          <div className="grid min-h-0 content-center gap-[4px]" style={{ color: GAME_BOARD_COLORS.tileText }}>
            {deed.rentRows.slice(1).map((row) => (
              <div
                key={row.labelKey}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2 text-[12px]"
              >
                <span className="font-medium leading-[1.2] tracking-[0.01em]">
                  {formatLabel(row.labelKey)}
                </span>
                <span
                  className="block translate-y-[-1px] border-b border-dotted"
                  style={{ borderColor: GAME_BOARD_COLORS.border }}
                />
                <span
                  className="text-right font-bold tabular-nums leading-none"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ${row.amount.replace(/^M/, '')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p
              className="max-w-[18ch] text-lg font-black leading-tight"
              style={{ color: cornerText ? GAME_BOARD_COLORS.tileText : GAME_BOARD_COLORS.text }}
            >
              {nonDeedTitle}
            </p>
          </div>
        )}
      </div>

      {showActions && (
        <div
          className="grid grid-cols-2 gap-[3px]"
          style={{
            color: GAME_BOARD_COLORS.text,
          }}
        >
          <button
            type="button"
            onClick={onBuy}
            className="rounded-[12px] border px-3 py-2 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              backgroundColor: BOARD_TILE_COLORS.propertyGreen,
              borderColor: BOARD_TILE_COLORS.propertyGreen,
              color: BOARD_TILE_COLORS.altText,
            }}
          >
            Buy ${space.price}
          </button>
          <button
            type="button"
            onClick={onAuction}
            className="rounded-[12px] border px-3 py-2 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              backgroundColor: GAME_BOARD_COLORS.tile,
              borderColor: GAME_BOARD_COLORS.border,
              color: BOARD_TILE_COLORS.propertyBlue,
            }}
          >
            Auction
          </button>
        </div>
      )}
    </section>
  );
}
