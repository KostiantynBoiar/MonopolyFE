'use client';

import { useLayoutEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useGameStore } from '@/stores/game-store';
import { SpaceType } from '@/features/game-board/game-board.enums';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS, getSpaceHeaderColor, getSpaceHeaderTextColor } from '@/features/game-board/game-board.colors';
import type { DeedWindowProps } from '../deed.types';
import { getDeedInfo } from '../deed.utils';
import { getRentTitle, formatLabel, getCornerText, getSpecialText } from '../deed.helpers';
import { DEED_BTN } from '../deed.constants';
import { BuildingsStrip } from './BuildingsStrip';

export function DeedWindow({
  space,
  decisionSpace,
  onBuy,
  onAuction,
  canAct = true,
  canBuy = true,
  viewOnly = false,
  compact = false,
  ownership,
}: DeedWindowProps) {
  const t = useTranslations('Deed');
  const tBoard = useTranslations('Board') as unknown as (key: string) => string;
  const gameMode = useGameStore((s) => s.snapshot.game.gameMode);

  const isDecisionMode = Boolean(decisionSpace);
  const activeSpace = decisionSpace ?? space;
  const spaceName = tBoard(`tiles.${gameMode}.p${activeSpace.pos}`);

  const deed           = getDeedInfo(activeSpace.pos, gameMode);
  const isDeed         = deed !== null;
  const headlineRent   = deed?.rentRows[0]?.amount ?? (activeSpace.price != null ? `M${activeSpace.price}` : null);
  const cornerText     = activeSpace.type === SpaceType.CORNER ? getCornerText(activeSpace.corner, t) : null;
  const specialText    = !isDeed && !cornerText ? getSpecialText(activeSpace, t) : null;
  const isSpecialCard  = Boolean(specialText);
  const showActions    = canAct && (isDecisionMode || !viewOnly) && isDeed && activeSpace.price != null;
  const showBuildings  = viewOnly && isDeed && ownership != null && (ownership.hotel || ownership.houses > 0);
  const useViewOnlyDeedShell        = viewOnly && isDeed && !isDecisionMode;
  const renderBuildingsInsideInfo   = showBuildings && !showActions;
  const nonDeedTitle   = cornerText?.title ?? specialText ?? t('special.default');
  const headerColor    = getSpaceHeaderColor(activeSpace);
  const headerTextColor = getSpaceHeaderTextColor(activeSpace);

  const headerTextRef = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = headerTextRef.current;
    if (!el) return;
    el.style.fontSize = '';
    const isMultiLine = () => {
      const s = getComputedStyle(el);
      const lh = s.lineHeight === 'normal' ? parseFloat(s.fontSize) * 1.2 : parseFloat(s.lineHeight);
      return el.scrollHeight > Math.ceil(lh * 1.4);
    };
    if (!isMultiLine()) return;
    for (const px of (compact ? [9, 8, 7, 6] : [15, 13, 11, 9, 8, 7, 6])) {
      el.style.fontSize = `${px}px`;
      if (!isMultiLine()) break;
    }
  }, [spaceName, compact]);

  const rentRowsRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = rentRowsRef.current;
    if (!el) return;
    const candidates = compact ? [13, 12, 11, 10, 9, 8, 7, 6] : [16, 15, 14, 13, 12, 11, 10, 9];
    const fit = () => {
      el.style.rowGap = '';
      for (const px of candidates) {
        el.style.fontSize = `${px}px`;
        if (el.scrollHeight <= el.clientHeight) return;
      }
      el.style.rowGap = '0px';
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact, showActions, renderBuildingsInsideInfo, activeSpace.pos]);

  const outerBorder = isDecisionMode ? BOARD_TILE_COLORS.propertyYellow : GAME_BOARD_COLORS.border;

  return (
    <section
      className="grid h-full min-h-0 gap-[3px] overflow-hidden rounded-[16px] border p-[6px]"
      style={{
        gridTemplateRows: useViewOnlyDeedShell
          ? 'auto minmax(0,1fr)'
          : isDeed
          ? (showActions || (showBuildings && !renderBuildingsInsideInfo)
            ? 'auto minmax(0,1fr) auto'
            : 'auto minmax(0,1fr)')
          : 'auto minmax(0,1fr)',
        backgroundColor: GAME_BOARD_COLORS.panel,
        backgroundImage: `radial-gradient(${GAME_BOARD_COLORS.border} 0.5px, transparent 0.5px)`,
        backgroundSize:  '14px 14px',
        borderColor:     outerBorder,
        borderWidth:     isDecisionMode ? '2px' : '1px',
        boxShadow:       isDecisionMode
          ? '0 0 0 3px rgba(228,192,106,0.25), 0 8px 24px rgba(51,48,43,0.14)'
          : 'none',
        color:           GAME_BOARD_COLORS.text,
      }}
    >
      {/* Space name / color header */}
      <div
        className={`relative overflow-hidden rounded-[12px] border text-center ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
        style={{
          backgroundColor: headerColor,
          borderColor:     headerColor,
          color:           headerTextColor,
          boxShadow:       '0 1px 3px rgba(51,48,43,0.16)',
        }}
      >
        <p ref={headerTextRef} className={`break-words font-display font-semibold uppercase tracking-[0.08em] ${compact ? 'text-[11px]' : 'text-lg'}`}>
          {spaceName}
        </p>
      </div>

      {/* Rent / info body */}
      <div
        className={`grid min-h-0 overflow-hidden rounded-[12px] border self-stretch ${compact ? 'px-2 py-1' : 'px-3 py-3'}`}
        style={{
          gridTemplateRows: isDeed && deed ? 'auto auto minmax(0,1fr)' : isSpecialCard ? '1fr' : 'auto 1fr',
          backgroundColor:  GAME_BOARD_COLORS.surface,
          borderColor:      GAME_BOARD_COLORS.border,
          boxShadow:        '0 1px 2px rgba(51,48,43,0.06)',
        }}
      >
        {!isSpecialCard && (
          <div className="text-center">
            <p className={`font-semibold ${compact ? 'text-[12px]' : 'text-base'}`} style={{ color: GAME_BOARD_COLORS.text }}>
              {isDeed && deed ? getRentTitle(deed, t) : cornerText?.eyebrow ?? t('status')}
            </p>
            <p className={`mt-1 font-black leading-none ${compact ? 'text-xl' : showActions ? 'text-2xl' : 'text-4xl'}`} style={{ color: GAME_BOARD_COLORS.tileText }}>
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
            className="flex min-h-0 h-full flex-col overflow-hidden"
            style={{ color: GAME_BOARD_COLORS.tileText }}
          >
            <div
              ref={rentRowsRef}
              className={`grid min-h-0 h-full overflow-hidden ${compact ? 'gap-[2px]' : 'gap-[6px]'}`}
              style={{
                fontSize: compact ? '13px' : '16px',
                alignContent: renderBuildingsInsideInfo ? 'start' : 'center',
              }}
            >
              {deed.rentRows.slice(1).map((row) => (
                <div
                  key={row.labelKey}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2"
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
              <BuildingsStrip ownership={ownership} backgroundColor={headerColor} className="mt-auto" />
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
        <div className="grid grid-cols-2 gap-[4px]" style={{ color: GAME_BOARD_COLORS.text }}>
          <button
            type="button"
            onClick={onBuy}
            disabled={!canBuy}
            className={`${DEED_BTN} px-1.5 py-1.5`}
            style={{
              backgroundColor: BOARD_TILE_COLORS.propertyGreen,
              borderColor:     BOARD_TILE_COLORS.propertyGreen,
              color:           BOARD_TILE_COLORS.altText,
              boxShadow:       '0 2px 10px rgba(121,180,143,0.45)',
            }}
          >
            {t('buyWithAmount', { amount: activeSpace.price ?? 0 })}
          </button>
          <button
            type="button"
            onClick={onAuction}
            className={`${DEED_BTN} px-1.5 py-1.5`}
            style={{
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor:     GAME_BOARD_COLORS.border,
              color:           BOARD_TILE_COLORS.propertyBlue,
              boxShadow:       '0 1px 2px rgba(51,48,43,0.08)',
            }}
          >
            {t('auction')}
          </button>
        </div>
      )}

      {/* Buildings strip — shown in viewOnly mode when ownership is provided */}
      {showBuildings && ownership && !renderBuildingsInsideInfo && (
        <BuildingsStrip ownership={ownership} backgroundColor={headerColor} />
      )}
    </section>
  );
}
