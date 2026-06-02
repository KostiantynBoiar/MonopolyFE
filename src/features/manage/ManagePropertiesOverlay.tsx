'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import type { PropertyColor } from '@/features/game-board';
import { BOARD } from '@/features/game-board';
import { DeedWindow } from '@/features/deed';

export interface ManageProperty {
  position:    number;
  name:        string;
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

interface ActionBtnProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}

function ActionBtn({ label, onClick, disabled, primary }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full rounded border font-display font-bold uppercase tracking-wide transition-colors active:scale-95',
        'disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-muted/50',
        primary && !disabled
          ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
          : 'border-ink/40 bg-surface text-ink hover:bg-paper',
      )}
      style={{ fontSize: '1em', padding: '0.5em 0.75em' }}
    >
      {label}
    </button>
  );
}

export function ManagePropertiesOverlay({
  properties,
  canBuildHouse, canBuildHotel, canMortgage, canUnmortgage,
  onBuildHouse, onBuildHotel, onSellHouse, onSellHotel,
  onMortgage, onUnmortgage, onSellProperty, onClose,
}: ManagePropertiesOverlayProps) {
  const t = useTranslations('Manage');

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-paper">
      {/* Header — matches TradeOverlay */}
      <div className="flex shrink-0 items-center gap-3 border-b-2 border-ink/20 bg-ink px-4 py-2.5">
        <span className="font-mono text-[0.72em] font-bold uppercase tracking-widest text-white/70">
          {t('title')}
        </span>
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="ml-auto font-mono text-[1.4em] leading-none text-white/50 transition-colors hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Properties — horizontal scroll of deed cards */}
      <div className="flex min-h-0 flex-1 overflow-x-auto p-4" style={{ fontSize: '1.2em' }}>
        {properties.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-8 py-6">
            <span className="font-sans text-[0.78em] italic text-muted">
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
                    <DeedWindow space={space} viewOnly />
                  ) : (
                    <div className="flex w-[12em] items-center justify-center rounded-xl border-2 border-ink bg-white px-3 py-6">
                      <span className="text-center font-display text-[0.8em] font-bold text-ink">{p.name}</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="flex items-center justify-center gap-1 font-mono text-[0.58em] text-muted">
                    {p.isMortgaged
                      ? <span className="text-red">{t('mortgaged')}</span>
                      : p.hotel
                      ? <span>🏨 Hotel</span>
                      : p.houses > 0
                      ? <span>{'🏠'.repeat(p.houses)}</span>
                      : <span>{t('noBuildings')}</span>}
                    <span className="ml-auto font-bold text-ink">M{p.rent}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1">
                    {p.isMortgaged ? (
                      <ActionBtn label={t('unmortgage')} onClick={() => onUnmortgage(p.position)} disabled={!canUnmortgage} primary />
                    ) : (
                      <>
                        {p.inMonopoly && !p.hotel && p.houses < 4 && (
                          <ActionBtn label={t('buildHouse')} onClick={() => onBuildHouse(p.position)} disabled={!canBuildHouse} primary />
                        )}
                        {p.inMonopoly && p.houses === 4 && (
                          <ActionBtn label={t('buildHotel')} onClick={() => onBuildHotel(p.position)} disabled={!canBuildHotel} primary />
                        )}
                        {p.color && p.houses > 0 && (
                          <ActionBtn label={t('sellHouse')} onClick={() => onSellHouse(p.position)} />
                        )}
                        {p.hotel && (
                          <ActionBtn label={t('sellHotel')} onClick={() => onSellHotel(p.position)} />
                        )}
                        {!p.hotel && p.houses === 0 && (
                          <ActionBtn label={t('mortgage')} onClick={() => onMortgage(p.position)} disabled={!canMortgage} />
                        )}
                        {onSellProperty && !p.hotel && p.houses === 0 && (
                          <ActionBtn label={t('sellToBank')} onClick={() => onSellProperty(p.position)} />
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
      <div className="flex shrink-0 items-center justify-end border-t-2 border-ink/20 bg-line/30 px-4 py-2.5">
        <button
          onClick={onClose}
          className="rounded border border-line-2 bg-surface font-display text-[1em] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
          style={{ padding: '0.55em 1em' }}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
