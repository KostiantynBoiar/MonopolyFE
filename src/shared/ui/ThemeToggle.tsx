'use client';

import { useTheme } from './ThemeProvider';
import { Icon } from './Icon';
import { cn } from '@/shared/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-line hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        className,
      )}
    >
      {theme === 'dark' ? <Icon name="sun" /> : <Icon name="moon" />}
    </button>
  );
}
