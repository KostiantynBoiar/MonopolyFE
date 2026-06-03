'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { LogKind } from '@/shared/protocol/game-state.enums';
import type { ChatLogProps } from '../chat.types';

const PANEL_STYLE = {
  backgroundColor: GAME_BOARD_COLORS.tile,
  borderColor: GAME_BOARD_COLORS.tileBorder,
  color: GAME_BOARD_COLORS.tileText,
} as const;
const HEADER_BORDER_STYLE = {
  borderColor: GAME_BOARD_COLORS.tileBorder,
} as const;
const HEADER_TEXT_STYLE = {
  color: GAME_BOARD_COLORS.muted,
  fontSize: '0.78rem',
} as const;
const EVENT_TEXT_STYLE = {
  color: GAME_BOARD_COLORS.muted,
  fontSize: '0.82rem',
} as const;
const MESSAGE_TEXT_STYLE = {
  color: GAME_BOARD_COLORS.tileText,
  fontSize: '0.9rem',
} as const;
const PLAYER_NAME_FALLBACK = '#10182E';

function StickerImage({ url }: { url: string }) {
  const t = useTranslations('Chat');

  return (
    <img
      src={url}
      alt={t('stickerAlt')}
      className="mt-1 block rounded object-contain"
      style={{ width: 80, height: 80 }}
    />
  );
}

function ChatLogHeader({ label }: { label: string }) {
  return (
    <div className="shrink-0 border-b px-4 py-3" style={HEADER_BORDER_STYLE}>
      <span
        className="font-display font-semibold uppercase tracking-[0.28em]"
        style={HEADER_TEXT_STYLE}
      >
        {label}
      </span>
    </div>
  );
}

function EventRow({ text }: { text: string }) {
  return (
    <p className="font-sans italic" style={EVENT_TEXT_STYLE}>
      {text}
    </p>
  );
}

function MessageRow({
  entry,
}: {
  entry: ChatLogProps['log'][number];
}) {
  const tokenColor = entry.playerToken ? TOKEN_COLORS[entry.playerToken] : PLAYER_NAME_FALLBACK;

  return (
    <div className="flex items-start gap-2">
      {entry.playerToken && (
        <span
          className="mt-1 h-3 w-3 shrink-0 rounded-full border"
          style={{ background: TOKEN_COLORS[entry.playerToken] }}
        />
      )}

      <div className="min-w-0">
        <span
          className="mr-1.5 font-sans font-semibold"
          style={{ color: tokenColor, fontSize: '0.9rem' }}
        >
          {entry.playerName}
        </span>
        {entry.kind === LogKind.STICKER && entry.stickerUrl ? (
          <StickerImage url={entry.stickerUrl} />
        ) : (
          <span className="font-sans" style={MESSAGE_TEXT_STYLE}>
            {entry.text}
          </span>
        )}
      </div>
    </div>
  );
}

export function ChatLog({ log }: ChatLogProps) {
  const t = useTranslations('Chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border"
      style={PANEL_STYLE}
    >
      <ChatLogHeader label={t('tableChat')} />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {log.map((entry) =>
          entry.kind === LogKind.EVENT ? (
            <EventRow key={entry.id} text={entry.text} />
          ) : (
            <MessageRow key={entry.id} entry={entry} />
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
