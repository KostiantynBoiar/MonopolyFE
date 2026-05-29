import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/shared/ui';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-paper flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link
          href="/home"
          className="flex items-center justify-center gap-2.5 mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 rounded-sm"
        >
          <Badge variant="gold" className="h-8 w-8 px-0 text-sm font-semibold">
            T
          </Badge>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            TYCOON
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
