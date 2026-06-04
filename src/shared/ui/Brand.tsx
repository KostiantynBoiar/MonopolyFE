import Link from 'next/link';
import { cn } from '@/shared/lib/cn';
import { Badge } from './Badge';

/** The TYCOON wordmark lockup, linking home. Used in site/profile headers and the auth layout. */
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/home"
      className={cn(
        'flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        className,
      )}
    >
      <Badge variant="gold" className="h-8 w-8 px-0 text-sm font-semibold">
        T
      </Badge>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">TYCOON</span>
    </Link>
  );
}
