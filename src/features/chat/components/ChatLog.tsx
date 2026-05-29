'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';
import { TOKEN_COLORS, type TokenColor } from '@/features/player-panel';

export type ChatMessage = {
  id: string;
  kind: 'chat' | 'event';
  author?: string;
  token?: TokenColor;
  text: string;
  ts: number;
};

type ChatLogProps = {
  messages: ChatMessage[];
};

export function ChatLog({ messages }: ChatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ fontSize: '0.7em' }}>
      {/* header */}
      <div className="shrink-0 border-b border-ink/20 px-[1em] py-[0.5em]">
        <span className="font-display font-semibold uppercase tracking-widest text-ink/60" style={{ fontSize: '0.75em' }}>
          Game Log
        </span>
      </div>

      {/* messages */}
      <div className="flex flex-1 flex-col gap-[0.4em] overflow-y-auto px-[1em] py-[0.6em]">
        {messages.map((msg) =>
          msg.kind === 'event' ? (
            <p key={msg.id} className="font-sans italic text-ink/50" style={{ fontSize: '0.85em' }}>
              {msg.text}
            </p>
          ) : (
            <div key={msg.id} className="flex items-start gap-[0.5em]">
              {msg.token && (
                <span
                  className="mt-[0.15em] h-[1em] w-[1em] shrink-0 rounded-full border border-ink/20"
                  style={{ background: TOKEN_COLORS[msg.token] }}
                />
              )}
              <p className="min-w-0 font-sans text-ink" style={{ fontSize: '0.9em' }}>
                <span
                  className="mr-[0.35em] font-semibold"
                  style={{ color: msg.token ? TOKEN_COLORS[msg.token] : '#10182E' }}
                >
                  {msg.author}
                </span>
                {msg.text}
              </p>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
