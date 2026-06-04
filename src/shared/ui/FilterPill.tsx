import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** A small rounded toggle pill for filters — active state fills with ink. */
export function FilterPill({ active, onClick, children }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-xs lg:text-sm',
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-line bg-surface text-muted hover:border-ink/40 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
