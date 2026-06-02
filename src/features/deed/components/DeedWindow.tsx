'use client';

import { useTranslations } from 'next-intl';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import { CornerVariant, SpaceType } from '@/features/game-board/game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor, getSpaceHeaderTextColor } from '@/features/game-board/game-board.colors';
import type { DeedInfo } from '../deed.types';
import { DeedSpaceType } from '../deed.enums';
import { getDeedInfo } from '../deed.utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BuildingState {
  houses: number;
  hotel:  boolean;
}

interface DeedWindowProps {
  space: BoardSpace;              // tile selected by the user (browse mode)
  decisionSpace?: BoardSpace | null; // when set: player just landed here — forces buy/auction UI
  onBuy?: () => void;
  onAuction?: () => void;
  viewOnly?: boolean;
  compact?: boolean;              // smaller typography to fit constrained height containers
  ownership?: BuildingState | null; // when set in viewOnly: renders a buildings strip at the bottom
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRentTitle(deed: DeedInfo) {
  switch (deed.spaceType) {
    case DeedSpaceType.RAILROAD: return 'Base Fare';
    case DeedSpaceType.UTILITY:  return 'Usage';
    default:                      return 'Rent';
  }
}

function formatLabel(key: string) {
  const MAP: Record<string, string> = {
    base:        'Base Rent',
    house1:      'With 1 House',
    house2:      'With 2 Houses',
    house3:      'With 3 Houses',
    house4:      'With 4 Houses',
    hotel:       'With Hotel',
    railroad1:   '1 Railroad',
    railroad2:   '2 Railroads',
    railroad3:   '3 Railroads',
    railroad4:   '4 Railroads',
    utility1:    '1 Utility',
    utilityBoth: '2 Utilities',
  };
  return MAP[key] ?? key;
}

function getCornerText(corner: CornerVariant | undefined) {
  switch (corner) {
    case CornerVariant.GO:       return { eyebrow: 'Corner', title: 'Collect salary when you pass.', value: 'GO' };
    case CornerVariant.JAIL:     return { eyebrow: 'Corner', title: 'Just visiting or locked in.',   value: 'JAIL' };
    case CornerVariant.PARKING:  return { eyebrow: 'Corner', title: 'Safe place to breathe.',        value: 'FREE' };
    case CornerVariant.GOTO_JAIL:return { eyebrow: 'Corner', title: 'Do not pass GO.',               value: 'JAIL' };
    default:                     return { eyebrow: 'Corner', title: 'Board anchor space.',           value: 'CORNER' };
  }
}

function getSpecialText(space: BoardSpace) {
  switch (space.type) {
    case SpaceType.CHANCE: return 'Draw a chance card';
    case SpaceType.CHEST:  return 'Open the community chest';
    case SpaceType.TAX:    return `Pay the listed amount ($${space.price ?? 0})`;
    default:               return 'Board space information';
  }
}

// ─── DeedWindow ───────────────────────────────────────────────────────────────

export function DeedWindow({ space, decisionSpace, onBuy, onAuction, viewOnly = false, compact = false, ownership }: DeedWindowProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tBoard = useTranslations('Board') as unknown as (key: string) => string;

  const isDecisionMode = Boolean(decisionSpace);
  // In decision mode show the landed-on space; otherwise show the browsed space.
  const activeSpace = decisionSpace ?? space;
  const spaceName = tBoard(`tiles.p${activeSpace.pos}`);

  const deed           = getDeedInfo(activeSpace.pos);
  const isDeed         = deed !== null;
  const headlineRent   = deed?.rentRows[0]?.amount ?? (activeSpace.price != null ? `M${activeSpace.price}` : null);
  const cornerText     = activeSpace.type === SpaceType.CORNER ? getCornerText(activeSpace.corner) : null;
  const specialText    = !isDeed && !cornerText ? getSpecialText(activeSpace) : null;
  const isSpecialCard  = Boolean(specialText);
  // Actions: always visible in decision mode (player MUST choose); hidden in viewOnly browse mode.
  const showActions    = (isDecisionMode || !viewOnly) && isDeed && activeSpace.price != null;
  // Buildings strip: only in viewOnly when ownership data is supplied and there's something to show.
  const showBuildings  = viewOnly && isDeed && ownership != null && (ownership.hotel || ownership.houses > 0);
  const nonDeedTitle   = cornerText?.title ?? specialText ?? 'Board space information.';
  const headerColor    = getSpaceHeaderColor(activeSpace);
  const headerTextColor = getSpaceHeaderTextColor(activeSpace);

  // Decision mode uses a gold accent border to signal urgency.
  const outerBorder = isDecisionMode ? BOARD_TILE_COLORS.propertyYellow : GAME_BOARD_COLORS.border;

  return (
    <section
      className="grid h-full min-h-0 gap-[3px] overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        gridTemplateRows: isDeed
          ? (showActions || showBuildings ? 'auto auto minmax(0,1fr) auto' : 'auto auto minmax(0,1fr)')
          : (isDecisionMode ? 'auto auto minmax(0,1fr)' : 'auto minmax(0,1fr)'),
        backgroundColor: GAME_BOARD_COLORS.panel,
        borderColor:     outerBorder,
        borderWidth:     isDecisionMode ? '2px' : '1px',
        color:           GAME_BOARD_COLORS.text,
      }}
    >
      {/* Decision banner — only in decision mode */}
      {isDecisionMode && (
        <div
          className="flex items-center justify-center rounded-[8px] px-2 py-1"
          style={{
            backgroundColor: BOARD_TILE_COLORS.propertyYellow,
            color:           BOARD_TILE_COLORS.altText,
          }}
        >
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em]">
            Your Move — Decide
          </span>
        </div>
      )}

      {/* Space name / color header */}
      <div
        className="relative overflow-hidden rounded-[10px] border px-3 py-2 text-center"
        style={{
          backgroundColor: headerColor,
          borderColor:     headerColor,
          color:           headerTextColor,
        }}
      >
        <p className={`font-display font-semibold uppercase tracking-[0.08em] ${compact ? 'text-[11px]' : 'text-lg'}`}>
          {spaceName}
        </p>
      </div>

      {/* Rent / info body */}
      <div
        className="grid min-h-0 rounded-[10px] border px-3 py-3"
        style={{
          gridTemplateRows: isDeed && deed ? 'auto auto minmax(0,1fr)' : isSpecialCard ? '1fr' : 'auto 1fr',
          backgroundColor:  GAME_BOARD_COLORS.surface,
          borderColor:      GAME_BOARD_COLORS.border,
        }}
      >
        {!isSpecialCard && (
          <div className="text-center">
            <p className={`font-semibold ${compact ? 'text-[10px]' : 'text-sm'}`} style={{ color: GAME_BOARD_COLORS.text }}>
              {isDeed && deed ? getRentTitle(deed) : cornerText?.eyebrow ?? 'Status'}
            </p>
            <p className={`mt-1 font-black leading-none ${compact ? 'text-xl' : 'text-4xl'}`} style={{ color: GAME_BOARD_COLORS.tileText }}>
              {isDeed && headlineRent
                ? `$${headlineRent.replace(/^M/, '')}`
                : cornerText?.value ?? '--'}
            </p>
          </div>
        )}

        {isDeed && deed && (
          <div className="my-[3px] h-px" style={{ backgroundColor: GAME_BOARD_COLORS.border }} />
        )}

        {isDeed && deed ? (
          <div className="grid min-h-0 content-center gap-[5px]" style={{ color: GAME_BOARD_COLORS.tileText }}>
            {deed.rentRows.slice(1).map((row) => (
              <div
                key={row.labelKey}
                className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2 ${compact ? 'text-[10px]' : 'text-sm'}`}
              >
                <span className="font-medium leading-[1.2] tracking-[0.01em]">
                  {formatLabel(row.labelKey)}
                </span>
                <span
                  className="block translate-y-[-1px] border-b border-dotted"
                  style={{ borderColor: GAME_BOARD_COLORS.border }}
                />
                <span className="text-right font-bold tabular-nums leading-none">
                  ${row.amount.replace(/^M/, '')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p
              className={`max-w-[18ch] font-black leading-tight ${compact ? 'text-sm' : 'text-lg'}`}
              style={{ color: cornerText ? GAME_BOARD_COLORS.tileText : GAME_BOARD_COLORS.text }}
            >
              {nonDeedTitle}
            </p>
          </div>
        )}
      </div>

      {/* Buy / Auction actions */}
      {showActions && (
        <div className="grid grid-cols-2 gap-[3px]" style={{ color: GAME_BOARD_COLORS.text }}>
          <button
            type="button"
            onClick={onBuy}
            className="rounded-[6px] border px-1.5 py-0.5 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              backgroundColor: BOARD_TILE_COLORS.propertyGreen,
              borderColor:     BOARD_TILE_COLORS.propertyGreen,
              color:           BOARD_TILE_COLORS.altText,
            }}
          >
            Buy ${activeSpace.price}
          </button>
          <button
            type="button"
            onClick={onAuction}
            className="rounded-[6px] border px-1.5 py-0.5 text-sm font-black uppercase tracking-[0.04em]"
            style={{
              backgroundColor: GAME_BOARD_COLORS.tile,
              borderColor:     GAME_BOARD_COLORS.border,
              color:           BOARD_TILE_COLORS.propertyBlue,
            }}
          >
            Auction
          </button>
        </div>
      )}

      {/* Buildings strip — shown in viewOnly mode when ownership data is provided */}
      {showBuildings && ownership && (
        <div
          className="flex items-center justify-center gap-1 rounded-[8px] px-2 py-2"
          style={{ backgroundColor: headerColor }}
        >
          {ownership.hotel ? (
            <div
              title="Hotel"
              style={{
                width: 16, height: 16,
                backgroundColor: '#8B2020',
                borderRadius: 3,
                border: '1.5px solid rgba(255,255,255,0.88)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
              }}
            />
          ) : (
            Array.from({ length: ownership.houses }).map((_, i) => (
              <div
                key={i}
                title={`House ${i + 1}`}
                style={{
                  width: 12, height: 12,
                  backgroundColor: '#1A6B3A',
                  borderRadius: 2,
                  border: '1.5px solid rgba(255,255,255,0.88)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}
