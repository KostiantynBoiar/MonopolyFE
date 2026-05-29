import { cn } from '@/shared/lib/cn';
import type { SpaceType } from '../board-data';

type SpecialTileProps = {
  type: Exclude<SpaceType, 'corner' | 'property'>;
  name: string;
  price?: number;
  className?: string;
};

const typeStyle: Record<SpecialTileProps['type'], { top: string; symbol: string; topText: string }> = {
  railroad: { top: 'bg-ink',         symbol: '🚂', topText: '' },
  utility:  { top: 'bg-ink',         symbol: '⚡', topText: '' },
  chance:   { top: 'bg-band-orange', symbol: '?',  topText: 'CHANCE' },
  chest:    { top: 'bg-band-cyan',   symbol: '📦', topText: 'COMMUNITY CHEST' },
  tax:      { top: 'bg-red',         symbol: '$',  topText: '' },
};

export function SpecialTile({ type, name, price, className }: SpecialTileProps) {
  const { top, symbol, topText } = typeStyle[type];

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col border-[1.5px] border-ink bg-paper',
        className,
      )}
    >
      {/* Top band */}
      <div className={cn('flex shrink-0 items-center justify-center border-b-[1.5px] border-ink', top)} style={{ height: '23%' }}>
        {topText && (
          <span className="text-center font-display text-[0.38em] font-bold uppercase leading-none text-white">
            {topText}
          </span>
        )}
      </div>

      {/* Symbol */}
      <div className="flex flex-1 items-center justify-center">
        <span className="text-[0.7em] leading-none">{symbol}</span>
      </div>

      {/* Name + price */}
      <div className="flex shrink-0 flex-col items-center justify-end pb-[6%]">
        <p className="px-[6%] text-center font-display text-[0.38em] font-semibold uppercase leading-tight text-ink">
          {name}
        </p>
        {price != null && (
          <p className="font-mono text-[0.38em] text-ink">
            M{price}
          </p>
        )}
      </div>
    </div>
  );
}
