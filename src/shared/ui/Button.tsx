import Link from 'next/link';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type ButtonVariant = 'gold' | 'blue' | 'dark' | 'ghost';
type ButtonSize = 'md' | 'sm';

const variantClasses: Record<ButtonVariant, string> = {
  gold: 'bg-gold text-white border border-gold-600 hover:bg-gold-600 shadow-sm',
  blue: 'bg-blue text-white border border-blue-600 hover:bg-blue-600 shadow-sm',
  dark: 'bg-ink text-paper border border-navy-700 hover:bg-navy-700 hover:text-white shadow-sm',
  ghost: 'bg-surface text-ink border border-line-2 hover:bg-paper shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };

type ButtonAsAnchor = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2';

export function Button(props: ButtonProps) {
  const { variant = 'blue', size = 'md', className, children } = props;
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors active:translate-y-px appearance-none',
    variantClasses[variant],
    sizeClasses[size],
    focusRing,
    className,
  );

  if (props.as === 'a') {
    const { as: _as, href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    const isInternal = href.startsWith('/');

    if (isInternal) {
      return (
        <Link href={href} className={classes} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const { as: _as, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
