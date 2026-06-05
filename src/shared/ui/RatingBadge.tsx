import { cn } from '@/shared/lib/cn';

// Small ELO pill. A "?" suffix + muted styling marks a still-provisional (calibrating)
// rating, mirroring the Badge design language.
export function RatingBadge({
  rating,
  provisional = false,
  className,
  title,
}: {
  rating: number;
  provisional?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? (provisional ? 'Provisional rating (calibrating)' : 'Rating')}
      className={cn(
        'inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tabular-nums',
        provisional ? 'border-line bg-paper text-muted' : 'border-gold/30 bg-gold-50 text-gold-600',
        className,
      )}
    >
      {rating}
      {provisional ? '?' : ''}
    </span>
  );
}
