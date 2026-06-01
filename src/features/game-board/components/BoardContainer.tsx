'use client';

import type { BoardContainerProps } from '../game-board.types';

export function BoardContainer({ centerContent }: BoardContainerProps) {
  return (
    <div className="flex h-screen w-full items-center justify-center p-5">
      <section
        className="flex h-full w-full max-w-[calc(100vw-40px)] rounded-[28px] border border-line-2 bg-surface p-5 shadow-lg"
        aria-label="Board layout preview"
      >
        <div className="grid h-full w-full gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)]">
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[22px] border border-blue/20 bg-blue/80 p-6 text-center text-blue-50 shadow-md">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_58%)]" />
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            {centerContent ?? (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.35em] text-blue-50/80">
                  Future Game Board
                </p>
                <p className="mt-3 font-serif text-3xl font-semibold text-white">
                  Blue board area
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="flex min-h-[220px] flex-col justify-between rounded-[22px] border border-green/20 bg-green/85 p-6 text-white shadow-md">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/80">
              Future Player Panel
            </p>
            <p className="mt-3 font-serif text-3xl font-semibold">
              Green side panel
            </p>
          </div>

          <p className="max-w-xs text-sm text-white/80">
            Reserved for player cards, balances, turn state, and quick actions.
          </p>
        </aside>
        </div>
      </section>
    </div>
  );
}
