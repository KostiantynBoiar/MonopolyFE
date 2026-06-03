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
  canAct?: boolean;              // true only for the viewer who may answer a buy decision
  viewOnly?: boolean;
  compact?: boolean;              // smaller typography to fit constrained height containers
  ownership?: BuildingState | null; // when set in viewOnly: renders a buildings strip at the bottom
}

type DeedTranslator = (key: string, values?: Record<string, string | number>) => string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRentTitle(deed: DeedInfo, t: DeedTranslator) {
  switch (deed.spaceType) {
    case DeedSpaceType.RAILROAD: return t('rentTitle.railroad');
    case DeedSpaceType.UTILITY:  return t('rentTitle.utility');
    default:                     return t('rentTitle.default');
  }
}

function formatLabel(key: string, t: DeedTranslator) {
  const MAP: Record<string, string> = {
    base:        t('row.base'),
    house1:      t('row.house1'),
    house2:      t('row.house2'),
    house3:      t('row.house3'),
    house4:      t('row.house4'),
    hotel:       t('row.hotel'),
    railroad1:   t('row.railroad1'),
    railroad2:   t('row.railroad2'),
    railroad3:   t('row.railroad3'),
    railroad4:   t('row.railroad4'),
    utility1:    t('row.utility1'),
    utilityBoth: t('row.utilityBoth'),
  };
  return MAP[key] ?? key;
}

function getCornerText(corner: CornerVariant | undefined, t: DeedTranslator) {
  switch (corner) {
    case CornerVariant.GO:        return { eyebrow: t('corner.eyebrow'), title: t('corner.go.title'), value: t('corner.go.value') };
    case CornerVariant.JAIL:      return { eyebrow: t('corner.eyebrow'), title: t('corner.jail.title'), value: t('corner.jail.value') };
    case CornerVariant.PARKING:   return { eyebrow: t('corner.eyebrow'), title: t('corner.parking.title'), value: t('corner.parking.value') };
    case CornerVariant.GOTO_JAIL: return { eyebrow: t('corner.eyebrow'), title: t('corner.gotoJail.title'), value: t('corner.gotoJail.value') };
    default:                      return { eyebrow: t('corner.eyebrow'), title: t('corner.default.title'), value: t('corner.default.value') };
  }
}

function getSpecialText(space: BoardSpace, t: DeedTranslator) {
  switch (space.type) {
    case SpaceType.CHANCE: return t('special.chance');
    case SpaceType.CHEST:  return t('special.chest');
    case SpaceType.TAX:    return t('special.tax', { amount: space.price ?? 0 });
    default:               return t('special.default');
  }
}

// ─── DeedWindow ───────────────────────────────────────────────────────────────

export function DeedWindow({
  space,
  decisionSpace,
  onBuy,
  onAuction,
  canAct = true,
  viewOnly = false,
  compact = false,
  ownership,
}: DeedWindowProps) {
  const t = useTranslations('Deed');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tBoard = useTranslations('Board') as unknown as (key: string) => string;

  const isDecisionMode = Boolean(decisionSpace);
  // In decision mode show the landed-on space; otherwise show the browsed space.
  const activeSpace = decisionSpace ?? space;
  const spaceName = tBoard(`tiles.p${activeSpace.pos}`);

  const deed           = getDeedInfo(activeSpace.pos);
  const isDeed         = deed !== null;
  const headlineRent   = deed?.rentRows[0]?.amount ?? (activeSpace.price != null ? `M${activeSpace.price}` : null);
  const cornerText     = activeSpace.type === SpaceType.CORNER ? getCornerText(activeSpace.corner, t) : null;
  const specialText    = !isDeed && !cornerText ? getSpecialText(activeSpace, t) : null;
  const isSpecialCard  = Boolean(specialText);
  // Actions are visible only when this viewer can answer the active buy decision.
  const showActions    = canAct && (isDecisionMode || !viewOnly) && isDeed && activeSpace.price != null;
  // Buildings strip: only in viewOnly when ownership data is supplied and there's something to show.
  const showBuildings  = viewOnly && isDeed && ownership != null && (ownership.hotel || ownership.houses > 0);
  const useViewOnlyDeedShell = viewOnly && isDeed && !isDecisionMode;
  const renderBuildingsInsideInfo = showBuildings && !showActions;
  const nonDeedTitle   = cornerText?.title ?? specialText ?? t('special.default');
  const headerColor    = getSpaceHeaderColor(activeSpace);
  const headerTextColor = getSpaceHeaderTextColor(activeSpace);

  // Decision mode uses a gold accent border to signal urgency.
  const outerBorder = isDecisionMode ? BOARD_TILE_COLORS.propertyYellow : GAME_BOARD_COLORS.border;

  return (
    <section
      className="grid h-full min-h-0 gap-[3px] overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        gridTemplateRows: useViewOnlyDeedShell
          ? 'auto minmax(0,1fr)'
          : isDeed
          ? (showActions || (showBuildings && !renderBuildingsInsideInfo)
            ? 'auto auto minmax(0,1fr) auto'
            : 'auto auto minmax(0,1fr)')
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
            {t('yourMoveDecide')}
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
        className="grid min-h-0 rounded-[10px] border px-3 py-3 self-stretch"
        style={{
          gridTemplateRows: isDeed && deed ? 'auto auto minmax(0,1fr)' : isSpecialCard ? '1fr' : 'auto 1fr',
          backgroundColor:  GAME_BOARD_COLORS.surface,
          borderColor:      GAME_BOARD_COLORS.border,
        }}
      >
        {!isSpecialCard && (
          <div className="text-center">
            <p className={`font-semibold ${compact ? 'text-[10px]' : 'text-sm'}`} style={{ color: GAME_BOARD_COLORS.text }}>
              {isDeed && deed ? getRentTitle(deed, t) : cornerText?.eyebrow ?? t('status')}
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
          <div
            className="flex min-h-0 h-full flex-col"
            style={{ color: GAME_BOARD_COLORS.tileText }}
          >
            <div
              className="grid min-h-0 h-full gap-[5px]"
              style={{
                alignContent: renderBuildingsInsideInfo ? 'start' : (!showActions ? 'center' : 'center'),
              }}
            >
              {deed.rentRows.slice(1).map((row) => (
                <div
                  key={row.labelKey}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2 ${compact ? 'text-[10px]' : 'text-sm'}`}
                >
                  <span className="font-medium leading-[1.2] tracking-[0.01em]">
                    {formatLabel(row.labelKey, t)}
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

            {renderBuildingsInsideInfo && ownership && (
              <div
                className="mt-auto flex items-center justify-center gap-1 rounded-[8px] px-2 py-2"
                style={{ backgroundColor: headerColor }}
              >
                {ownership.hotel ? (
                  <div
                    title={t('building.hotel')}
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
                      title={t('building.houseNumber', { count: i + 1 })}
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
            {t('buyWithAmount', { amount: activeSpace.price ?? 0 })}
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
            {t('auction')}
          </button>
        </div>
      )}

      {/* Buildings strip — shown in viewOnly mode when ownership data is provided */}
      {showBuildings && ownership && !renderBuildingsInsideInfo && (
        <div
          className="flex items-center justify-center gap-1 rounded-[8px] px-2 py-2"
          style={{ backgroundColor: headerColor }}
        >
          {ownership.hotel ? (
            <div
              title={t('building.hotel')}
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
                title={t('building.houseNumber', { count: i + 1 })}
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
