import { cn } from '@/shared/lib/cn';
import type { CornerVariant } from '../board-data';

const configs: Record<CornerVariant, { bg: string; label: string; sub?: string; accent: string }> = {
  go: {
    bg: 'bg-paper',
    label: 'GO',
    sub: 'Collect M200 salary as you pass',
    accent: 'text-red',
  },
  jail: {
    bg: 'bg-paper',
    label: 'Just Visiting',
    sub: 'In Jail',
    accent: 'text-ink',
  },
  parking: {
    bg: 'bg-paper',
    label: 'Free Parking',
    accent: 'text-ink',
  },
  gotojail: {
    bg: 'bg-paper',
    label: 'Go to Jail',
    sub: 'Go directly to jail',
    accent: 'text-ink',
  },
};

type CornerTileProps = {
  variant: CornerVariant;
  className?: string;
};

export function CornerTile({ variant, className }: CornerTileProps) {
  const { bg, label, sub, accent } = configs[variant];

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center border-[1.5px] border-ink p-1',
        bg,
        className,
      )}
    >
      <span className={cn('text-center font-display text-[0.6em] font-bold uppercase leading-tight', accent)}>
        {label}
      </span>
      {sub && (
        <span className="mt-0.5 text-center font-sans text-[0.38em] leading-tight text-muted">
          {sub}
        </span>
      )}
    </div>
  );
}
