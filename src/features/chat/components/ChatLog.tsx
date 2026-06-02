'use client';

import { useEffect, useRef } from 'react';
import { TOKEN_COLORS } from '@/features/player-panel';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { LogKind } from '@/shared/protocol/game-state.enums';
import type { ChatLogProps } from '../chat.types';

export function ChatLog({ log }: ChatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border"
      style={{
        backgroundColor: GAME_BOARD_COLORS.tile,
        borderColor: GAME_BOARD_COLORS.tileBorder,
        color: GAME_BOARD_COLORS.tileText,
      }}
    >
      <div
        className="shrink-0 border-b px-4 py-3"
        style={{ borderColor: GAME_BOARD_COLORS.tileBorder }}
      >
        <span
          className="font-display font-semibold uppercase tracking-[0.28em]"
          style={{ color: GAME_BOARD_COLORS.muted, fontSize: '0.78rem' }}
        >
          Table Chat
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {log.map((entry) =>
          entry.kind === LogKind.EVENT ? (
            <p
              key={entry.id}
              className="font-sans italic"
              style={{ color: GAME_BOARD_COLORS.muted, fontSize: '0.82rem' }}
            >
              {entry.text}
            </p>
          ) : (
            <div key={entry.id} className="flex items-start gap-2">
              {entry.playerToken && (
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full border"
                  style={{ background: TOKEN_COLORS[entry.playerToken] }}
                />
              )}
              <p className="min-w-0 font-sans" style={{ color: GAME_BOARD_COLORS.tileText, fontSize: '0.9rem' }}>
                <span
                  className="mr-1.5 font-semibold"
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
    </section>
  );
}
