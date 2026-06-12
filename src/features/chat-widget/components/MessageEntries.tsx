'use client';

import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TOKEN_COLORS } from '@/shared/config/constants';
import type { ChatMessage } from '../chat.types';
import { formatChatTime, getStickerUrl, isOwnMessage, sameSender } from '../chat.utils';
import { StickerPreview } from './StickerPicker';

const C = GAME_BOARD_COLORS;
const T = BOARD_TILE_COLORS;

interface MessageEntriesProps {
  entries: ChatMessage[];
  viewerUserId?: string;
  playerLabel: string;
  youLabel: string;
  stickerAlt: string;
}

export function MessageEntries({ entries, viewerUserId, playerLabel, youLabel, stickerAlt }: MessageEntriesProps) {
  return (
    <div className="flex flex-col px-1.5 py-1">
      {entries.map((entry, i) => {
        const prev = entries[i - 1];
        const next = entries[i + 1];
        const own = isOwnMessage(entry, viewerUserId);
        const firstOfRun = !prev || !sameSender(prev, entry);
        const lastOfRun  = !next || !sameSender(next, entry);

        const stickerUrl = getStickerUrl(entry.text ?? '');
        const author     = own ? youLabel : entry.author ?? playerLabel;
        const tokenColor = entry.token ? TOKEN_COLORS[entry.token] : C.muted;

        const corners = [
          'rounded-[16px]',
          own
            ? (lastOfRun ? 'rounded-br-[5px]' : '')
            : (lastOfRun ? 'rounded-bl-[5px]' : ''),
          !firstOfRun && (own ? 'rounded-tr-[5px]' : 'rounded-tl-[5px]'),
        ]
          .filter(Boolean)
          .join(' ');

        const bubbleStyle = own
          ? {
              backgroundColor: C.text,
              color: T.altText,
              boxShadow: '0 1px 2px rgba(51,48,43,0.18)',
            }
          : {
              backgroundColor: C.surface,
              color: C.text,
              border: `1px solid ${C.border}`,
            };

        return (
          <div
            key={entry.id}
            className={`flex w-full ${own ? 'justify-end' : 'justify-start'}`}
            style={{
              marginTop: firstOfRun ? (i === 0 ? 0 : 8) : 2,
              animation: 'chatBubbleIn 0.22s ease-out both',
            }}
          >
            <div className={`flex max-w-[86%] flex-col ${own ? 'items-end' : 'items-start'}`}>
              {firstOfRun && !own && (
                <div className="mb-[3px] flex items-center gap-1.5 pl-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tokenColor, boxShadow: `0 0 0 2px ${C.panel}` }}
                  />
                  <span
                    className="font-display text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: tokenColor }}
                  >
                    {author}
                  </span>
                </div>
              )}

              {stickerUrl ? (
                <div
                  className="drop-shadow-sm"
                  title={`${formatChatTime(entry.ts)} | ${author}`}
                >
                  <StickerPreview url={stickerUrl} alt={stickerAlt} size={92} />
                </div>
              ) : (
                <div className={`group/bubble relative ${corners} px-3 py-1.5`} style={bubbleStyle}>
                  <p
                    className="whitespace-pre-wrap text-left text-[14.5px] leading-[1.4]"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {entry.text}
                  </p>
                  <span
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] tabular-nums opacity-0 transition-opacity duration-150 group-hover/bubble:opacity-100"
                    style={{
                      color: C.muted,
                      ...(own ? { right: 'calc(100% + 8px)' } : { left: 'calc(100% + 8px)' }),
                    }}
                  >
                    {formatChatTime(entry.ts)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
