'use client';

import type { BoardSpace } from '@/features/game-board';
import { SpaceType } from '@/features/game-board';
import { CornerVariant } from '@/features/game-board/game-board.enums';
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
      return {
        eyebrow: 'Chance',
        title: 'Draw a chance card.',
        value: 'DRAW',
        details: ['Random event', 'Can move, pay, or collect'],
      };
    case SpaceType.CHEST:
      return {
        eyebrow: 'Community',
        title: 'Open the community chest.',
        value: 'DRAW',
        details: ['Shared event deck', 'Usually cash or movement'],
      };
    case SpaceType.TAX:
      return {
        eyebrow: 'Tax',
        title: 'Pay the listed amount.',
        value: `$${space.price ?? 0}`,
        details: ['Mandatory payment'],
      };
    default:
      return {
        eyebrow: 'Status',
        title: 'Field details unavailable.',
        value: '--',
        details: ['No extra rules'],
      };
  }
}

export function DeedWindow({ space, onBuy, onAuction }: DeedWindowProps) {
  const deed = getDeedInfo(space.pos);
  const isDeed = deed !== null;
  const headlineRent = deed?.rentRows[0]?.amount ?? (space.price != null ? `M${space.price}` : null);
  const cornerText = space.type === SpaceType.CORNER ? getCornerText(space.corner) : null;
  const specialText = !isDeed && !cornerText ? getSpecialText(space) : null;
  const showActions = isDeed && space.price != null;

  return (
    <section
      className="grid h-full min-h-0 overflow-hidden rounded-[18px] border p-[3px]"
      style={{
        gridTemplateRows: isDeed
          ? showActions
            ? 'auto auto auto minmax(0, 1fr)'
            : 'auto auto minmax(0, 1fr)'
          : 'auto auto',
        backgroundColor: GAME_BOARD_COLORS.deedShell,
        borderColor: GAME_BOARD_COLORS.deedShellBorder,
        color: GAME_BOARD_COLORS.tileText,
        boxShadow: `0 8px 18px ${GAME_BOARD_COLORS.boardShadow}`,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[14px] border px-3 py-2 text-center"
        style={{
          background: `linear-gradient(180deg, ${GAME_BOARD_COLORS.deedRail} 0%, ${GAME_BOARD_COLORS.deedRailDark} 100%)`,
          borderColor: '#6ea1ff',
          color: GAME_BOARD_COLORS.boardCenterText,
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-lg opacity-35">🏠</div>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-lg opacity-35">🏠</div>
        <p className="font-display text-xl font-semibold uppercase tracking-[0.08em]">
          {space.name}
        </p>
      </div>

      <div
        className="flex items-center justify-center rounded-[12px] border px-3 py-2 text-center"
        style={{
          minHeight: isDeed ? '33%' : 'calc(100% - 6px)',
          backgroundColor: GAME_BOARD_COLORS.deedBody,
          borderColor: GAME_BOARD_COLORS.deedRule,
          boxShadow: `inset 0 1px 0 ${GAME_BOARD_COLORS.deedBodyInset}`,
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm font-semibold" style={{ color: GAME_BOARD_COLORS.tileText }}>
            {isDeed && deed ? getRentTitle(deed) : cornerText?.eyebrow ?? specialText?.eyebrow ?? 'Status'}
          </p>
          <p className="mt-1 text-4xl font-black leading-none" style={{ color: '#141414' }}>
            {isDeed && headlineRent
              ? `$${headlineRent.replace(/^M/, '')}`
              : cornerText?.value ?? specialText?.value ?? '--'}
          </p>
          {!isDeed && (
            <p className="mt-2 text-sm font-medium" style={{ color: GAME_BOARD_COLORS.priceText }}>
              {cornerText?.title ?? specialText?.title}
            </p>
          )}
        </div>
      </div>

      {isDeed && deed && (
        <div
          className="min-h-0 overflow-hidden rounded-[12px] border px-3 py-2"
          style={{
            backgroundColor: GAME_BOARD_COLORS.deedBody,
            borderColor: GAME_BOARD_COLORS.deedRule,
          }}
        >
          <div className="grid gap-1">
            {deed.rentRows.slice(1).map((row) => (
              <div
                key={row.labelKey}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px]"
                style={{ color: '#1e1e1e' }}
              >
                <span className="truncate font-medium">
                  {formatLabel(row.labelKey)}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="block h-px min-w-8 flex-1"
                    style={{
                      backgroundImage: `radial-gradient(circle, ${GAME_BOARD_COLORS.deedRule} 1px, transparent 1.5px)`,
                      backgroundSize: '6px 1px',
                      backgroundRepeat: 'repeat-x',
                    }}
                  />
                  <span className="shrink-0 text-[9px] font-bold">
                    ${row.amount.replace(/^M/, '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <div
          className="grid h-full min-h-0 grid-cols-2 gap-3 rounded-[12px] border p-2"
          style={{
            backgroundColor: GAME_BOARD_COLORS.deedBody,
            borderColor: GAME_BOARD_COLORS.deedRule,
          }}
        >
          <button
            type="button"
            onClick={onBuy}
            className="h-full rounded-[12px] border px-3 py-2 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              background: `linear-gradient(180deg, ${GAME_BOARD_COLORS.deedBuy} 0%, ${GAME_BOARD_COLORS.deedBuyDark} 100%)`,
              borderColor: '#69d27f',
              color: '#f8fff9',
              boxShadow: '0 2px 0 rgba(0,0,0,0.18)',
            }}
          >
            Buy ${space.price}
          </button>
          <button
            type="button"
            onClick={onAuction}
            className="h-full rounded-[12px] border px-3 py-2 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              background: `linear-gradient(180deg, ${GAME_BOARD_COLORS.deedAuction} 0%, #f2f2f2 100%)`,
              borderColor: '#d6d6d6',
              color: GAME_BOARD_COLORS.deedAuctionText,
              boxShadow: '0 2px 0 rgba(0,0,0,0.14)',
            }}
          >
            Auction
          </button>
        </div>
      )}
    </section>
  );
}
