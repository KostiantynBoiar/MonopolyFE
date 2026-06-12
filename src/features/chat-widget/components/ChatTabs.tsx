import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { ChatWindowTab } from '../chat.enums';

const C = GAME_BOARD_COLORS;
const T = BOARD_TILE_COLORS;

const TAB_CLASS =
  'relative z-10 flex min-h-0 items-center justify-center gap-2 rounded-[9px] py-2 text-center font-display text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200';

interface ChatTabsProps {
  activeTab: ChatWindowTab;
  unreadCount: number;
  eventsLabel: string;
  chatLabel: string;
  onTabChange: (tab: ChatWindowTab) => void;
}

export function ChatTabs({ activeTab, unreadCount, eventsLabel, chatLabel, onTabChange }: ChatTabsProps) {
  const isChat = activeTab === ChatWindowTab.CHAT;

  return (
    <header
      className="relative grid grid-cols-2 rounded-[12px] border p-[3px]"
      style={{ borderColor: C.border, backgroundColor: C.panel }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[3px] left-[3px] rounded-[9px] transition-transform duration-300 ease-out"
        style={{
          width: 'calc(50% - 3px)',
          backgroundColor: C.surface,
          boxShadow: '0 1px 3px rgba(51,48,43,0.14)',
          transform: isChat ? 'translateX(100%)' : 'translateX(0)',
        }}
      />

      <button
        type="button"
        className={TAB_CLASS}
        style={{ color: isChat ? C.muted : C.text }}
        onClick={() => onTabChange(ChatWindowTab.EVENTS)}
      >
        {eventsLabel}
      </button>

      <button
        type="button"
        className={TAB_CLASS}
        style={{ color: isChat ? C.text : C.muted }}
        onClick={() => onTabChange(ChatWindowTab.CHAT)}
      >
        {chatLabel}
        {unreadCount > 0 && (
          <span
            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums"
            style={{ backgroundColor: T.propertyRed, color: T.altText }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}
