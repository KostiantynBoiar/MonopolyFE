'use client';

import { Icon } from './Icon';
import { cn } from '@/shared/lib/cn';

interface SettingsButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export function SettingsButton({ onClick, className, label = 'Open settings' }: SettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-line hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        className,
      )}
    >
      <Icon name="settings" />
    </button>
  );
}
