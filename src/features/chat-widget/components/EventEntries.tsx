import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import type { LogEntry } from '@/shared/protocol/game-state';
import { renderGameEvent } from '@/shared/protocol/log';
import { formatChatTime } from '../chat.utils';

const C = GAME_BOARD_COLORS;

type EventTranslator = (key: string, values?: Record<string, string | number>) => string;

interface EventEntriesProps {
  entries: LogEntry[];
  tLog: EventTranslator;
  resolveTileName: (position: number) => string;
  resolveCardText: (cardId: string, cardKind: string) => string;
}

export function EventEntries({ entries, tLog, resolveTileName, resolveCardText }: EventEntriesProps) {
  return (
    <div className="flex flex-col gap-[1px] py-1">
      {entries.map((entry) => {
        const text = entry.event
          ? (renderGameEvent(entry.event, tLog, resolveTileName, resolveCardText) ?? entry.text)
          : entry.text;

        return (
          <div
            key={entry.id}
            className="group flex min-w-0 items-baseline gap-2 rounded-[7px] px-2 py-1 text-[13.5px] leading-snug transition-colors"
            style={{ color: C.text }}
          >
            <span
              className="mt-[6px] h-1.5 w-1.5 shrink-0 self-start rounded-full"
              style={{ backgroundColor: C.special }}
              aria-hidden="true"
            />
            <span
              className="shrink-0 font-mono text-[10.5px] tabular-nums"
              style={{ color: C.muted }}
            >
              {formatChatTime(new Date(entry.ts).getTime())}
            </span>
            <p
              className="min-w-0 flex-1 whitespace-pre-wrap"
              style={{ color: C.text, overflowWrap: 'anywhere' }}
            >
              {text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
