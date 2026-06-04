import type { ReactNode } from 'react';

/** A horizontal rule with centered label — "or continue with" style separators. */
export function OrDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 border-t border-line" />
      <span className="text-xs text-muted">{children}</span>
      <div className="flex-1 border-t border-line" />
    </div>
  );
}
