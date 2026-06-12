import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { PANEL_BORDER_STYLE } from '../chat.constants';

const C = GAME_BOARD_COLORS;
const T = BOARD_TILE_COLORS;

interface ComposerProps {
  draft: string;
  showStickers: boolean;
  placeholder: string;
  stickersLabel: string;
  openStickersLabel: string;
  sendLabel: string;
  onDraftChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleStickers: () => void;
  onSend: () => void;
}

export function Composer({
  draft,
  showStickers,
  placeholder,
  stickersLabel,
  openStickersLabel,
  sendLabel,
  onDraftChange,
  onKeyDown,
  onToggleStickers,
  onSend,
}: ComposerProps) {
  const canSend = draft.trim().length > 0;

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
      <div
        className="relative h-12 min-h-0 rounded-full border transition-colors"
        style={PANEL_BORDER_STYLE}
      >
        <button
          type="button"
          onClick={onToggleStickers}
          className="absolute left-[5px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
          style={{
            backgroundColor: showStickers ? T.propertyBlue : 'transparent',
            color: showStickers ? T.altText : C.muted,
          }}
          title={stickersLabel}
          aria-label={openStickersLabel}
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="7.5" cy="8" r="1" fill="currentColor" />
            <circle cx="12.5" cy="8" r="1" fill="currentColor" />
            <path d="M7 12c1 1 5 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-full min-h-0 w-full resize-none bg-transparent py-[14px] pl-12 pr-4 text-[15px] leading-tight outline-none placeholder:opacity-60"
          maxLength={128}
          style={{ color: C.text }}
        />
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label={sendLabel}
        title={sendLabel}
        className="flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 disabled:cursor-default"
        style={{
          backgroundColor: canSend ? T.propertyBlue : C.surface,
          borderColor: canSend ? T.propertyBlue : C.border,
          color: canSend ? T.altText : C.muted,
          transform: canSend ? 'scale(1)' : 'scale(0.96)',
          boxShadow: canSend ? '0 2px 6px rgba(116,162,202,0.4)' : 'none',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 -translate-x-[1px]">
          <path
            d="M4 12 20 4l-5 16-3.5-6.5L4 12Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
