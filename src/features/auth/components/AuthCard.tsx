import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  /** Lead-in text before the swap link, e.g. "Don't have an account?". */
  prompt: string;
  linkHref: string;
  linkLabel: string;
  children: ReactNode;
}

/** The bordered card shell shared by the sign-in and create-account screens. */
export function AuthCard({ title, prompt, linkHref, linkLabel, children }: AuthCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {prompt}{' '}
          <Link
            href={linkHref}
            className="font-medium text-blue hover:underline focus-visible:outline-none"
          >
            {linkLabel}
          </Link>
        </p>
      </div>
      {children}
    </div>
  );
}
