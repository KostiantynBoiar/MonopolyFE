'use client';

import { cn } from '@/shared/lib/cn';
import { bandColors } from '@/shared/config/constants';
import { DeedSpaceType } from '../deed.enums';
import type { DeedCardProps } from '../deed.types';

const SPACE_ICON: Record<DeedSpaceType, string> = {
  [DeedSpaceType.PROPERTY]: '',
  [DeedSpaceType.RAILROAD]: '🚂',
  [DeedSpaceType.UTILITY]:  '⚡',
};

export function DeedCard({ deed, onBuy, onAuction }: DeedCardProps) {
  const icon = SPACE_ICON[deed.spaceType];
  const hasColor = deed.color != null;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-white shadow-2xl"
      style={{ width: '12em' }}
    >
      {/* Band / header */}
      <div
        className={cn(
          'flex shrink-0 flex-col items-center justify-end px-2 pb-1.5 pt-2',
          hasColor ? bandColors[deed.color!] : 'bg-ink',
        )}
      >
        {!hasColor && icon && (
          <span className="mb-0.5 leading-none" style={{ fontSize: '1.1em' }}>{icon}</span>
        )}
        <span className="font-mono font-bold uppercase tracking-widest text-white/70" style={{ fontSize: '0.55em' }}>
          Title Deed
        </span>
        <span className="text-center font-display font-black uppercase leading-tight text-white" style={{ fontSize: '0.78em' }}>
          {deed.name}
        </span>
      </div>

      {/* Rent rows */}
      <div className="flex flex-col border-b border-ink/20 px-3 py-1.5">
        {deed.rentRows.map((row, i) => (
          <div key={row.label} className="flex items-baseline justify-between py-[0.15em]">
            <span
              className={cn('font-sans text-ink', i === 0 ? 'font-semibold' : 'font-normal')}
              style={{ fontSize: '0.62em' }}
            >
              {row.label}
            </span>
            <span
              className={cn('font-mono text-ink', i === 0 ? 'font-bold' : 'font-normal')}
              style={{ fontSize: '0.62em' }}
            >
              {row.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Building / mortgage */}
      <div className="flex flex-col border-b border-ink/20 px-3 py-1">
        {deed.buildingCost != null && (
          <div className="flex items-baseline justify-between py-[0.1em]">
            <span className="font-sans text-muted" style={{ fontSize: '0.58em' }}>Houses / Hotels</span>
            <span className="font-mono text-ink" style={{ fontSize: '0.58em' }}>M{deed.buildingCost} ea.</span>
          </div>
        )}
        <div className="flex items-baseline justify-between py-[0.1em]">
          <span className="font-sans text-muted" style={{ fontSize: '0.58em' }}>Mortgage Value</span>
          <span className="font-mono text-ink" style={{ fontSize: '0.58em' }}>M{deed.mortgageValue}</span>
        </div>
      </div>

      {/* Price + actions */}
      <div className="flex flex-col items-center gap-1.5 px-2 py-2">
        <span className="font-display font-black uppercase tracking-wide text-ink" style={{ fontSize: '0.78em' }}>
          Price M{deed.price}
        </span>
        <div className="flex w-full gap-1">
          <button
            onClick={onBuy}
            className="flex-1 rounded bg-green-600 py-1 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-green-700 active:scale-95"
            style={{ fontSize: '0.6em' }}
          >
            Buy
          </button>
          <button
            onClick={onAuction}
            className="flex-1 rounded border border-ink bg-surface py-1 font-display font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper active:scale-95"
            style={{ fontSize: '0.6em' }}
          >
            Auction
          </button>
        </div>
      </div>
    </div>
  );
}
