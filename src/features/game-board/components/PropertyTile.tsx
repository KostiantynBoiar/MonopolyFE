import { cn } from '@/shared/lib/cn';
import type { PropertyColor } from '../board-data';

const bandColors: Record<PropertyColor, string> = {
  brown: 'bg-band-brown',
  cyan: 'bg-band-cyan',
  pink: 'bg-band-pink',
  orange: 'bg-band-orange',
  red: 'bg-band-red',
  yellow: 'bg-band-yellow',
  green: 'bg-band-green',
  blue: 'bg-band-blue',
};

type PropertyTileProps = {
  name: string;
  price: number;
  color: PropertyColor;
  mortgaged?: boolean;
  houseCount?: 0 | 1 | 2 | 3 | 4 | 5;
  flipped?: boolean;
  className?: string;
};

export function PropertyTile({
  name,
  price,
  color,
  mortgaged = false,
  houseCount = 0,
  flipped = false,
  className,
}: PropertyTileProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full overflow-hidden border-[1.5px] border-ink bg-paper',
        flipped ? 'flex-col-reverse' : 'flex-col',
        mortgaged && 'opacity-40',
        className,
      )}
    >
      {/* Color band */}
      <div
        className={cn(
          'shrink-0',
          flipped ? 'border-t-[1.5px]' : 'border-b-[1.5px]',
          'border-ink',
          bandColors[color],
        )}
        style={{ height: '23%' }}
      >
        {houseCount > 0 && houseCount < 5 && (
          <div className="flex h-full items-center justify-center gap-px">
            {Array.from({ length: houseCount }).map((_, i) => (
              <div key={i} className="h-[60%] w-[10%] min-w-[3px] rounded-[1px] bg-green" />
            ))}
          </div>
        )}
        {houseCount === 5 && (
          <div className="flex h-full items-center justify-center">
            <div className="h-[60%] w-[30%] rounded-[1px] bg-red" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-[6%]">
        <p className="line-clamp-4 text-center font-display text-[0.45em] font-semibold uppercase leading-tight tracking-wide text-ink">
          {name}
        </p>
      </div>

      {/* Price */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center gap-[2%]',
          flipped ? 'pt-[6%]' : 'pb-[6%]',
        )}
      >
        <span className="font-mono text-[0.42em] font-bold text-ink">M</span>
        <span className="font-mono text-[0.42em] text-ink">{price}</span>
      </div>
    </div>
  );
}
