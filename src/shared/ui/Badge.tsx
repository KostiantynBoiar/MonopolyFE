import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type BadgeVariant = 'gold' | 'blue' | 'green' | 'red' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  gold: 'bg-gold-50 text-gold-600 border-gold/30',
  blue: 'bg-blue-50 text-blue border-blue/20',
  green: 'bg-green/10 text-green border-green/20',
  red: 'bg-red/10 text-red border-red/20',
  neutral: 'bg-paper text-muted border-line',
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wider',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
