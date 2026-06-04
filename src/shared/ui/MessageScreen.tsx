import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button';

interface MessageScreenAction {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface MessageScreenProps {
  title: string;
  message?: ReactNode;
  action?: MessageScreenAction;
  /** Use the error palette (red border + red message) instead of the neutral one. */
  tone?: 'neutral' | 'error';
  children?: ReactNode;
}

/**
 * Full-screen centered card used for terminal page states — "no active room",
 * join failures, and similar messages that replace the whole view.
 */
export function MessageScreen({ title, message, action, tone = 'neutral', children }: MessageScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <section
        className={cn(
          'w-full max-w-md rounded-[12px] border bg-surface p-5 text-center',
          tone === 'error' ? 'border-red/30' : 'border-line',
        )}
      >
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        {message ? (
          <p className={cn('mt-2 text-sm', tone === 'error' ? 'text-red' : 'text-muted')}>{message}</p>
        ) : null}
        {children}
        {action ? (
          action.href ? (
            <Button as="a" href={action.href} variant="blue" className="mt-4">
              {action.label}
            </Button>
          ) : (
            <Button onClick={action.onClick} variant="blue" className="mt-4" disabled={action.disabled}>
              {action.label}
            </Button>
          )
        ) : null}
      </section>
    </main>
  );
}
