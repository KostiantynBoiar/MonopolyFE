'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { PlayerSidebar } from './PlayerSidebar';
import type { Player } from '../player-panel.schema';

type Props = { players: Player[] };

export function FloatingPlayerSidebar({ players }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Show players"
        className={cn(
          'fixed right-3 top-3 z-40 flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 shadow-md',
          'text-xs font-semibold text-ink transition-opacity',
          'md:hidden',
          open && 'opacity-0 pointer-events-none',
        )}
      >
        {/* Users icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Players
        <span className="font-mono text-muted">
          {players.filter((p) => !p.isBankrupt).length}/{players.length}
        </span>
      </button>

      {/* Backdrop (mobile only) */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 md:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-l border-line bg-surface shadow-xl',
          'transition-transform duration-300 ease-in-out',
          // Mobile: slide in/out
          'translate-x-full md:translate-x-0',
          open && 'translate-x-0',
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close players panel"
          className="absolute right-3 top-3 rounded-sm p-1 text-muted transition-colors hover:text-ink md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <PlayerSidebar players={players} />
      </aside>
    </>
  );
}
