'use client';

import type { BoardSpace } from '@/features/game-board';
import { CornerVariant, SpaceType } from '@/features/game-board/game-board.enums';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
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
      return { eyebrow: 'Chance', title: 'Draw a chance card.', value: 'DRAW' };
    case SpaceType.CHEST:
      return { eyebrow: 'Community', title: 'Open the community chest.', value: 'DRAW' };
    case SpaceType.TAX:
      return { eyebrow: 'Tax', title: 'Pay the listed amount.', value: `$${space.price ?? 0}` };
    default:
      return { eyebrow: 'Status', title: 'Field details unavailable.', value: '--' };
  }
}

export function DeedWindow({ space, onBuy, onAuction }: DeedWindowProps) {
  const deed = getDeedInfo(space.pos);
  const isDeed = deed !== null;
  const headlineRent = deed?.rentRows[0]?.amount ?? (space.price != null ? `M${space.price}` : null);
  const cornerText = space.type === SpaceType.CORNER ? getCornerText(space.corner) : null;
  const specialText = !isDeed && !cornerText ? getSpecialText(space) : null;
  const showActions = isDeed && space.price != null;
  const nonDeedTitle = cornerText?.title ?? specialText?.title ?? 'Board space information.';

  return (
    <section
      className="grid h-full min-h-0 overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        gridTemplateRows: isDeed
          ? (showActions ? 'auto auto minmax(0,1fr) auto' : 'auto auto minmax(0,1fr)')
          : 'auto minmax(0,1fr)',
        backgroundColor: GAME_BOARD_COLORS.deedShell,
        borderColor: GAME_BOARD_COLORS.deedShellBorder,
        color: GAME_BOARD_COLORS.widgetText,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[10px] border px-3 py-2 text-center"
        style={{
          backgroundColor: GAME_BOARD_COLORS.deedRail,
          borderColor: GAME_BOARD_COLORS.deedRail,
          color: GAME_BOARD_COLORS.widgetHeaderText,
        }}
      >
        <p className="font-display text-lg font-semibold uppercase tracking-[0.08em]">
          {space.name}
        </p>
      </div>

      <div
        className="rounded-[10px] border px-3 py-2 text-center"
        style={{
          backgroundColor: GAME_BOARD_COLORS.deedBody,
          borderColor: GAME_BOARD_COLORS.deedRule,
        }}
      >
        <p className="text-sm font-semibold" style={{ color: GAME_BOARD_COLORS.widgetText }}>
          {isDeed && deed ? getRentTitle(deed) : cornerText?.eyebrow ?? specialText?.eyebrow ?? 'Status'}
        </p>
        <p className="mt-1 text-4xl font-black leading-none" style={{ color: '#141414' }}>
          {isDeed && headlineRent
            ? `$${headlineRent.replace(/^M/, '')}`
            : cornerText?.value ?? specialText?.value ?? '--'}
        </p>
      </div>

      {isDeed && deed ? (
        <div
          className="min-h-0 overflow-hidden rounded-[10px] border px-3 py-2"
          style={{
            backgroundColor: GAME_BOARD_COLORS.deedBody,
            borderColor: GAME_BOARD_COLORS.deedRule,
          }}
        >
          <div className="grid gap-1.5">
            {deed.rentRows.slice(1).map((row) => (
              <div
                key={row.labelKey}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[12px]"
                style={{ color: '#1e1e1e' }}
              >
                <span className="truncate font-medium">
                  {formatLabel(row.labelKey)}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="block h-px min-w-8 flex-1"
                    style={{
                      backgroundColor: GAME_BOARD_COLORS.deedRule,
                    }}
                  />
                  <span className="shrink-0 font-bold">
                    ${row.amount.replace(/^M/, '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="flex h-full min-h-0 items-center justify-center rounded-[10px] border px-4 py-3 text-center"
          style={{
            backgroundColor: GAME_BOARD_COLORS.deedBody,
            borderColor: GAME_BOARD_COLORS.deedRule,
            color: GAME_BOARD_COLORS.priceText,
          }}
        >
          <p className="max-w-[16ch] text-sm font-medium leading-snug">{nonDeedTitle}</p>
        </div>
      )}

      {showActions && (
        <div
          className="grid grid-cols-2 gap-3 rounded-[10px] border p-2"
          style={{
            backgroundColor: GAME_BOARD_COLORS.deedBody,
            borderColor: GAME_BOARD_COLORS.deedRule,
          }}
        >
          <button
            type="button"
            onClick={onBuy}
            className="rounded-[12px] border px-3 py-2 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              backgroundColor: GAME_BOARD_COLORS.widgetSuccess,
              borderColor: GAME_BOARD_COLORS.widgetSuccess,
              color: GAME_BOARD_COLORS.widgetSuccessText,
            }}
          >
            Buy ${space.price}
          </button>
          <button
            type="button"
            onClick={onAuction}
            className="rounded-[12px] border px-3 py-2 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              backgroundColor: GAME_BOARD_COLORS.widgetNeutral,
              borderColor: GAME_BOARD_COLORS.widgetBorder,
              color: GAME_BOARD_COLORS.widgetNeutralText,
            }}
          >
            Auction
          </button>
        </div>
      )}
    </section>
  );
}
