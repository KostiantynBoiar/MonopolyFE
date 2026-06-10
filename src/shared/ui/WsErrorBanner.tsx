'use client';

import { useEffect } from 'react';
import type { WsErrorPayload } from '@/shared/protocol/messages.schema';

const WS_ERROR_BANNER_DISMISS_DELAY_MS = 3_000;

export function WsErrorBanner({ error, onDismiss }: { error: WsErrorPayload | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!error) return;

    const timeoutId = window.setTimeout(onDismiss, WS_ERROR_BANNER_DISMISS_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [error, onDismiss]);

  if (!error) return null;
  return (
    <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-red px-4 py-2 text-white shadow-md">
      <span className="font-sans text-sm">
        <span className="font-semibold capitalize">{error.code.replace(/_/g, ' ')}</span>
        {' — '}
        {error.message}
      </span>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-white/20"
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
