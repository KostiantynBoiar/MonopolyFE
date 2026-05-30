'use client';

import { useEffect, useRef } from 'react';
import { TOKEN_COLORS } from '@/features/player-panel';
import { LogKind } from '@/shared/protocol/game-state';
import type { ChatLogProps } from '../chat.types';

export function ChatLog({ log }: ChatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ fontSize: '0.7em' }}>
      {/* header */}
      <div className="shrink-0 border-b border-ink/20 px-[1em] py-[0.5em]">
        <span className="font-display font-semibold uppercase tracking-widest text-ink/60" style={{ fontSize: '0.75em' }}>
          Game Log
        </span>
      </div>

      {/* entries */}
      <div className="flex flex-1 flex-col gap-[0.4em] overflow-y-auto px-[1em] py-[0.6em]">
        {log.map((entry) =>
          entry.kind === LogKind.EVENT ? (
            <p key={entry.id} className="font-sans italic text-ink/50" style={{ fontSize: '0.85em' }}>
              {entry.text}
            </p>
          ) : (
            <div key={entry.id} className="flex items-start gap-[0.5em]">
              {entry.playerToken && (
                <span
                  className="mt-[0.15em] h-[1em] w-[1em] shrink-0 rounded-full border border-ink/20"
                  style={{ background: TOKEN_COLORS[entry.playerToken] }}
                />
              )}
              <p className="min-w-0 font-sans text-ink" style={{ fontSize: '0.9em' }}>
                <span
                  className="mr-[0.35em] font-semibold"
                  style={{ color: entry.playerToken ? TOKEN_COLORS[entry.playerToken] : '#10182E' }}
                >
                  {entry.playerName}
                </span>
                {entry.text}
              </p>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
