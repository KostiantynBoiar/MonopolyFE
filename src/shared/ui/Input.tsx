import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-sm border bg-surface px-3 font-sans text-sm text-ink placeholder:text-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-50 focus-visible:border-blue',
        error
          ? 'border-red focus-visible:ring-red/20 focus-visible:border-red'
          : 'border-line-2',
        className,
      )}
      {...props}
    />
  );
});
