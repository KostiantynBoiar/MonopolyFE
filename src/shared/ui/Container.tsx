import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1180px] px-4 md:px-6', className)} {...props}>
      {children}
    </div>
  );
}
