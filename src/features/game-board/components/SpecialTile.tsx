import { cn } from '@/shared/lib/cn';
import type { SpaceType } from '../board-data';

type SpecialTileProps = {
  type: Exclude<SpaceType, 'corner' | 'property'>;
  name: string;
  price?: number;
  mortgaged?: boolean;
  ownerColor?: string; // hex token color of the owning player
  flipped?: boolean;
  className?: string;
};

const typeStyle: Record<SpecialTileProps['type'], { top: string; symbol: string; topText: string }> = {
  railroad: { top: 'bg-ink',         symbol: '🚂', topText: '' },
  utility:  { top: 'bg-ink',         symbol: '⚡', topText: '' },
  chance:   { top: 'bg-band-orange', symbol: '?',  topText: 'CHANCE' },
  chest:    { top: 'bg-band-cyan',   symbol: '📦', topText: 'COMMUNITY CHEST' },
  tax:      { top: 'bg-red',         symbol: '$',  topText: '' },
};

export function SpecialTile({
  type,
  name,
  price,
  mortgaged = false,
  ownerColor,
  flipped = false,
  className,
}: SpecialTileProps) {
  const { top, symbol, topText } = typeStyle[type];

  return (
    <div
      className={cn(
        'relative flex h-full w-full overflow-hidden border-[1.5px] border-ink bg-paper',
        flipped ? 'flex-col-reverse' : 'flex-col',
        mortgaged && 'opacity-40',
        className,
      )}
    >
      {/* Top band */}
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center',
          flipped ? 'border-t-[1.5px]' : 'border-b-[1.5px]',
          'border-ink',
          top,
        )}
        style={{ height: '23%' }}
      >
        {topText && (
          <span className="text-center font-display text-[0.38em] font-bold uppercase leading-none text-white">
            {topText}
          </span>
        )}

        {/* Owner dot */}
        {ownerColor && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: ownerColor,
              border: '1px solid rgba(255,255,255,0.85)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
            }}
          />
        )}
      </div>

      {/* Symbol */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <span className="text-[0.7em] leading-none">{symbol}</span>
      </div>

      {/* Name + price */}
      <div
        className={cn(
          'flex shrink-0 flex-col items-center justify-end overflow-hidden',
          flipped ? 'pt-[6%]' : 'pb-[6%]',
        )}
      >
        <p className="line-clamp-2 px-[6%] text-center font-display text-[0.38em] font-semibold uppercase leading-tight text-ink">
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
