import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface AlertProps {
  children: ReactNode;
  /** Optional trailing control (dismiss button, link, …) pinned to the end of the row. */
  action?: ReactNode;
  tone?: 'error';
  /** For caller-controlled spacing (margins) around the banner. */
  className?: string;
}

/** Inline notice banner — currently the red error/warning treatment used across lobby and forms. */
export function Alert({ children, action, tone = 'error', className }: AlertProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-sm border px-3 py-2 sm:gap-3 sm:px-4 sm:py-3',
        tone === 'error' && 'border-red/30 bg-red/5',
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-xs text-red sm:text-sm">{children}</span>
      {action}
    </div>
  );
}
