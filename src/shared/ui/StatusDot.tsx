import { cn } from '@/shared/lib/cn';

type StatusDotProps = {
  className?: string;
};

export function StatusDot({ className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)} aria-hidden="true">
      <span className="status-dot-ping absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
    </span>
  );
}
