'use client';

import { useTranslations } from 'next-intl';
import { useDialog } from '@/shared/hooks/useDialog';
import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import { BOARD } from '@/shared/config/board-layout';
import { useBoardTileName } from '@/features/game-board';
import { DeedWindow } from '@/features/deed';

export interface ManageProperty {
  position:    number;
  color?:      PropertyColor;
  houses:      0 | 1 | 2 | 3 | 4;
  hotel:       boolean;
  isMortgaged: boolean;
  inMonopoly:  boolean;
  rent:        number;
}

export interface ManagePropertiesOverlayProps {
  properties:     ManageProperty[];
  canBuildHouse:  boolean;
  canBuildHotel:  boolean;
  canMortgage:    boolean;
  canUnmortgage:  boolean;
  onBuildHouse:   (position: number) => void;
  onBuildHotel:   (position: number) => void;
  onSellHouse:    (position: number) => void;
  onSellHotel:    (position: number) => void;
  onMortgage:     (position: number) => void;
  onUnmortgage:   (position: number) => void;
  onSellProperty?: (position: number) => void;
  onClose:        () => void;
}

// ─── Shared action button ─────────────────────────────────────────────────────

interface ActionBtnProps {
  label:    string;
  onClick:  () => void;
  disabled?: boolean;
  primary?:  boolean;
}

function ActionBtn({ label, onClick, disabled, primary }: ActionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[8px] border font-display font-bold uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        fontSize: '0.72rem',
        letterSpacing: '0.07em',
        padding: '0.5em 0.75em',
        backgroundColor: primary && !disabled
          ? BOARD_TILE_COLORS.propertyBlue
          : GAME_BOARD_COLORS.panel,
        borderColor: primary && !disabled
          ? BOARD_TILE_COLORS.propertyBlue
          : GAME_BOARD_COLORS.border,
        color: primary && !disabled
          ? BOARD_TILE_COLORS.altText
          : GAME_BOARD_COLORS.text,
      }}
    >
      {label}
    </button>
  );
}

// ─── ManagePropertiesOverlay ──────────────────────────────────────────────────

export function ManagePropertiesOverlay({
  properties,
  canBuildHouse, canBuildHotel, canMortgage, canUnmortgage,
  onBuildHouse, onBuildHotel, onSellHouse, onSellHotel,
  onMortgage, onUnmortgage, onSellProperty, onClose,
}: ManagePropertiesOverlayProps) {
  const t = useTranslations('Manage');
  const resolveTileName = useBoardTileName();
  const dialog = useDialog<HTMLDivElement>({ onClose, label: t('title') });

  return (
    <div
      {...dialog}
      className="absolute inset-[6px] z-10 flex flex-col overflow-hidden rounded-[12px] border focus:outline-none"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {/* Accent strip — blue = management */}
      <div style={{ height: '4px', backgroundColor: BOARD_TILE_COLORS.propertyBlue, flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-3 px-5 py-3"
        style={{
          backgroundColor: GAME_BOARD_COLORS.panel,
          borderBottom: `1px solid ${GAME_BOARD_COLORS.border}`,
        }}
      >
        <h2
          className="font-display font-black uppercase"
          style={{ fontSize: '1rem', color: GAME_BOARD_COLORS.text }}
        >
          {t('title')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="ml-auto font-mono leading-none transition-opacity hover:opacity-60"
          style={{ fontSize: '1.1rem', color: GAME_BOARD_COLORS.muted }}
        >
          ✕
        </button>
      </div>

      {/* Property cards — horizontal scroll */}
      <div
        className="flex min-h-0 flex-1 overflow-x-auto p-4"
        style={{ fontSize: '1.15em' }}
      >
        {properties.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-8 py-6">
            <span
              className="font-sans italic"
              style={{ fontSize: '0.8rem', color: GAME_BOARD_COLORS.muted }}
            >
              {t('empty')}
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            {properties.map((p) => {
              const space = BOARD[p.position];
              return (
                <div key={p.position} className="flex shrink-0 flex-col gap-2">
                  {space ? (
                    <div style={{ width: '9.5em', height: '13em' }}>
                      <DeedWindow
                        space={space}
                        viewOnly
                        compact
                        ownership={{ houses: p.houses, hotel: p.hotel }}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex w-[12em] items-center justify-center rounded-[12px] px-3 py-6"
                      style={{
                        border: `1.5px solid ${GAME_BOARD_COLORS.border}`,
                        backgroundColor: GAME_BOARD_COLORS.panel,
                      }}
                    >
                      <span
                        className="text-center font-display font-bold"
                        style={{ fontSize: '0.8rem', color: GAME_BOARD_COLORS.text }}
                      >
                        {resolveTileName(p.position)}
                      </span>
                    </div>
                  )}

                  {/* Status badge */}
                  <div
                    className="flex items-center gap-1 font-mono"
                    style={{ fontSize: '0.6rem', color: GAME_BOARD_COLORS.muted }}
                  >
                    {p.isMortgaged ? (
                      <span style={{ color: BOARD_TILE_COLORS.propertyRed }}>{t('mortgaged')}</span>
                    ) : p.hotel ? (
                      <span>🏨 Hotel</span>
                    ) : p.houses > 0 ? (
                      <span>{'🏠'.repeat(p.houses)}</span>
                    ) : (
                      <span>{t('noBuildings')}</span>
                    )}
                    <span
                      className="ml-auto font-bold"
                      style={{ color: GAME_BOARD_COLORS.text }}
                    >
                      M{p.rent}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1">
                    {p.isMortgaged ? (
                      <ActionBtn
                        label={t('unmortgage')}
                        onClick={() => onUnmortgage(p.position)}
                        disabled={!canUnmortgage}
                        primary
                      />
                    ) : (
                      <>
                        {p.inMonopoly && !p.hotel && p.houses < 4 && (
                          <ActionBtn
                            label={t('buildHouse')}
                            onClick={() => onBuildHouse(p.position)}
                            disabled={!canBuildHouse}
                            primary
                          />
                        )}
                        {p.inMonopoly && p.houses === 4 && (
                          <ActionBtn
                            label={t('buildHotel')}
                            onClick={() => onBuildHotel(p.position)}
                            disabled={!canBuildHotel}
                            primary
                          />
                        )}
                        {p.color && p.houses > 0 && (
                          <ActionBtn
                            label={t('sellHouse')}
                            onClick={() => onSellHouse(p.position)}
                          />
                        )}
                        {p.hotel && (
                          <ActionBtn
                            label={t('sellHotel')}
                            onClick={() => onSellHotel(p.position)}
                          />
                        )}
                        {!p.hotel && p.houses === 0 && (
                          <ActionBtn
                            label={t('mortgage')}
                            onClick={() => onMortgage(p.position)}
                            disabled={!canMortgage}
                          />
                        )}
                        {onSellProperty && !p.hotel && p.houses === 0 && (
                          <ActionBtn
                            label={t('sellToBank')}
                            onClick={() => onSellProperty(p.position)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex shrink-0 items-center justify-end px-4 py-3"
        style={{
          borderTop: `1px solid ${GAME_BOARD_COLORS.border}`,
          backgroundColor: GAME_BOARD_COLORS.panel,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] border px-4 py-2 font-display font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            backgroundColor: GAME_BOARD_COLORS.surface,
            borderColor: GAME_BOARD_COLORS.border,
            color: GAME_BOARD_COLORS.text,
          }}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
