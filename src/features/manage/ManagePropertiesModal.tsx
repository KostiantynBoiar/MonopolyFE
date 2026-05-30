'use client';

import { cn } from '@/shared/lib/cn';
import { bandColors } from '@/shared/config/constants';
import type { PropertyColor } from '@/features/game-board';

export type ManageProperty = {
  position:    number;
  name:        string;
  color?:      PropertyColor;
  houses:      0 | 1 | 2 | 3 | 4;
  hotel:       boolean;
  isMortgaged: boolean;
  inMonopoly:  boolean;       // viewer owns the whole colour group → may build
  rent:        number;        // current rent at this build level (from getPropertyRent)
};

export type ManagePropertiesModalProps = {
  properties:     ManageProperty[];
  // Global permission gates (server-computed); per-property legality refines them.
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
  onSellProperty?: (position: number) => void;   // wired in Phase 16
  onClose:        () => void;
};

function MiniBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-ink/40 bg-surface px-1.5 py-0.5 font-display font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper active:scale-95 disabled:cursor-not-allowed disabled:border-line disabled:text-muted/50"
      style={{ fontSize: '0.55em' }}
    >
      {label}
    </button>
  );
}

export function ManagePropertiesModal({
  properties,
  canBuildHouse, canBuildHotel, canMortgage, canUnmortgage,
  onBuildHouse, onBuildHotel, onSellHouse, onSellHotel,
  onMortgage, onUnmortgage, onSellProperty, onClose,
}: ManagePropertiesModalProps) {
  return (
    <div className="flex max-h-[80%] w-[22em] flex-col overflow-hidden rounded-xl border-2 border-ink bg-white shadow-2xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-ink px-3 py-2">
        <span className="font-display font-black uppercase tracking-wide text-white" style={{ fontSize: '0.8em' }}>
          Manage Properties
        </span>
        <button
          onClick={onClose}
          className="font-mono text-white/70 transition-colors hover:text-white"
          style={{ fontSize: '0.8em' }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-line overflow-y-auto">
        {properties.length === 0 && (
          <div className="px-3 py-6 text-center font-sans italic text-muted" style={{ fontSize: '0.7em' }}>
            You don't own any properties yet.
          </div>
        )}
        {properties.map((p) => {
          const buildings = p.hotel ? 'Hotel' : p.houses > 0 ? `${p.houses} 🏠` : '—';
          return (
            <div key={p.position} className="flex flex-col gap-1 px-3 py-2">
              <div className="flex items-center gap-2">
                {p.color && (
                  <span className={cn('h-3 w-3 shrink-0 rounded-sm border border-ink/30', bandColors[p.color])} />
                )}
                <span
                  className={cn('flex-1 truncate font-sans font-semibold text-ink', p.isMortgaged && 'italic line-through opacity-60')}
                  style={{ fontSize: '0.72em' }}
                >
                  {p.name}
                </span>
                <span className="font-mono text-muted" style={{ fontSize: '0.6em' }}>{buildings}</span>
                <span className="font-mono font-bold text-ink" style={{ fontSize: '0.62em' }}>M{p.rent}</span>
              </div>

              {p.isMortgaged ? (
                <div className="flex gap-1">
                  <MiniBtn label="Unmortgage" onClick={() => onUnmortgage(p.position)} disabled={!canUnmortgage} />
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {p.inMonopoly && !p.hotel && p.houses < 4 && (
                    <MiniBtn label="Build House" onClick={() => onBuildHouse(p.position)} disabled={!canBuildHouse} />
                  )}
                  {p.inMonopoly && p.houses === 4 && (
                    <MiniBtn label="Build Hotel" onClick={() => onBuildHotel(p.position)} disabled={!canBuildHotel} />
                  )}
                  {p.color && p.houses > 0 && (
                    <MiniBtn label="Sell House" onClick={() => onSellHouse(p.position)} />
                  )}
                  {p.hotel && (
                    <MiniBtn label="Sell Hotel" onClick={() => onSellHotel(p.position)} />
                  )}
                  {!p.hotel && p.houses === 0 && (
                    <>
                      <MiniBtn label="Mortgage" onClick={() => onMortgage(p.position)} disabled={!canMortgage} />
                      {onSellProperty && (
                        <MiniBtn label="Sell to Bank" onClick={() => onSellProperty(p.position)} />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
