'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { ChatWindowTab } from '../chat.enums';
import type { ChatMessage, ChatWindowProps, StickerPack } from '../chat.types';

const TAB_BUTTON_CLASS =
  'flex min-h-0 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-center font-display text-[14px] font-semibold uppercase tracking-[0.16em]';
const PANEL_BORDER_STYLE = {
  borderColor: GAME_BOARD_COLORS.border,
  backgroundColor: GAME_BOARD_COLORS.surface,
} as const;
const MESSAGE_CARD_STYLE = {
  backgroundColor: GAME_BOARD_COLORS.surface,
} as const;
const TIMESTAMP_TEXT_STYLE = {
  color: GAME_BOARD_COLORS.muted,
} as const;
const BODY_TEXT_STYLE = {
  color: GAME_BOARD_COLORS.text,
  overflowWrap: 'anywhere' as const,
} as const;

function formatTime(ts: number) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts);
}

function getStickerUrl(text: string) {
  const match = text.match(/^\[sticker:(.+?)\]$/);
  return match?.[1] ?? null;
}

function isTgsSticker(url: string) {
  return url.toLowerCase().endsWith('.tgs');
}

function clampMessage(text: string) {
  return text.slice(0, 128);
}

function getTabStyle(isActive: boolean) {
  return {
    backgroundColor: isActive ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
    color: isActive ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
    borderColor: GAME_BOARD_COLORS.border,
  };
}

function getStickerPackStyle(isActive: boolean) {
  return {
    backgroundColor: isActive ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
    color: isActive ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
  };
}

function useStickerPacks() {
  const [packs, setPacks] = useState<StickerPack[]>([]);

  useEffect(() => {
    fetch('/stickers/manifest.json')
      .then((response) => response.json())
      .then((data) => setPacks(data.packs ?? []))
      .catch(() => {});
  }, []);

  return packs;
}

function StickerFallback({ size, label = 'TGS' }: { size: number; label?: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[8px] border text-[11px] font-black uppercase tracking-[0.12em]"
      style={{
        width: size,
        height: size,
        backgroundColor: GAME_BOARD_COLORS.panel,
        borderColor: GAME_BOARD_COLORS.border,
        color: GAME_BOARD_COLORS.muted,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

function StickerPreview({
  url,
  alt,
  size,
  loop = true,
  autoplay = true,
}: {
  url: string;
  alt: string;
  size: number;
  loop?: boolean;
  autoplay?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (isTgsSticker(url)) {
    return (
      <TgsPlayer
        src={url}
        size={size}
        loop={loop}
        autoplay={autoplay}
        fallback={<StickerFallback size={size} />}
      />
    );
  }

  if (failed) {
    return <StickerFallback size={size} label="IMG" />;
  }

  return (
    <img
      src={url}
      alt={alt}
      className="max-w-full object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

function StickerCell({
  file,
  index,
  onSelect,
  packId,
}: {
  file: string;
  index: number;
  onSelect: (url: string) => void;
  packId: string;
}) {
  const url = `/stickers/${packId}/${file}`;
  const isTgs = isTgsSticker(file);
  const [mounted, setMounted] = useState(!isTgs);

  useEffect(() => {
    if (!isTgs) return;

    const mount = () => setMounted(true);
    let idleId: number | null = null;
    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(mount, { timeout: 300 });
        return;
      }

      mount();
    }, index * 30);

    return () => {
      window.clearTimeout(timer);
      if (idleId != null) window.cancelIdleCallback(idleId);
    };
  }, [index, isTgs]);

  return (
    <button
      type="button"
      onClick={() => onSelect(url)}
      className="flex h-[60px] w-[60px] items-center justify-center rounded-[8px] border"
      style={PANEL_BORDER_STYLE}
    >
      {isTgs && !mounted
        ? <StickerFallback size={45} />
        : <StickerPreview url={url} alt={file} size={45} loop={false} autoplay={false} />}
    </button>
  );
}

function ChatTabs({
  activeTab,
  unreadCount,
  onTabChange,
  eventsLabel,
  chatLabel,
}: {
  activeTab: ChatWindowTab;
  unreadCount: number;
  onTabChange: (tab: ChatWindowTab) => void;
  eventsLabel: string;
  chatLabel: string;
}) {
  return (
    <header className="grid grid-cols-[3fr_1fr] gap-[3px]">
      <button
        type="button"
        className={TAB_BUTTON_CLASS}
        style={getTabStyle(activeTab === ChatWindowTab.EVENTS)}
        onClick={() => onTabChange(ChatWindowTab.EVENTS)}
      >
        <span>{eventsLabel}</span>
      </button>

      <button
        type="button"
        className={TAB_BUTTON_CLASS}
        style={getTabStyle(activeTab === ChatWindowTab.CHAT)}
        onClick={() => onTabChange(ChatWindowTab.CHAT)}
      >
        <span>{chatLabel}</span>
        {unreadCount > 0 && (
          <span
            className="flex min-w-5 items-center justify-center rounded-full px-1.5 text-[14px] font-bold"
            style={{
              backgroundColor: BOARD_TILE_COLORS.propertyRed,
              color: BOARD_TILE_COLORS.altText,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex h-full items-center justify-center rounded-[8px] text-center text-[15px]"
      style={{ color: GAME_BOARD_COLORS.muted }}
    >
      {label}
    </div>
  );
}

function EventEntries({
  entries,
  tableLabel,
}: {
  entries: ChatWindowProps['log'];
  tableLabel: string;
}) {
  return (
    <div className="grid gap-[3px]">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="grid min-w-0 gap-[1px] rounded-[8px] px-2 py-1.5"
          style={MESSAGE_CARD_STYLE}
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em]" style={TIMESTAMP_TEXT_STYLE}>
            {formatTime(new Date(entry.ts).getTime())}
          </p>
          <p
            className="min-w-0 whitespace-pre-wrap text-center text-[15px] leading-[1.35]"
            style={BODY_TEXT_STYLE}
          >
            <span className="font-semibold">{entry.playerName ?? tableLabel}</span>
            {': '}
            {entry.text}
          </p>
        </article>
      ))}
    </div>
  );
}

function MessageEntries({
  entries,
  playerLabel,
  stickerAlt,
}: {
  entries: ChatMessage[];
  playerLabel: string;
  stickerAlt: string;
}) {
  return (
    <div className="grid gap-[3px]">
      {entries.map((entry) => {
        const stickerUrl = getStickerUrl(entry.text);
        const author = entry.author ?? playerLabel;

        return (
          <article
            key={entry.id}
            className="grid min-w-0 gap-[2px] rounded-[8px] px-2 py-1.5"
            style={MESSAGE_CARD_STYLE}
          >
            <div className="flex flex-wrap items-center gap-2 text-[13px] uppercase tracking-[0.12em]" style={TIMESTAMP_TEXT_STYLE}>
              <span>{formatTime(entry.ts)}</span>
              {entry.token && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: TOKEN_COLORS[entry.token] }}
                />
              )}
              <span
                className="font-semibold"
                style={{ color: entry.token ? TOKEN_COLORS[entry.token] : GAME_BOARD_COLORS.muted }}
              >
                {author}
              </span>
            </div>

            {stickerUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                <StickerPreview url={stickerUrl} alt={stickerAlt} size={80} />
              </div>
            ) : (
              <p
                className="min-w-0 whitespace-pre-wrap text-left text-[15px] leading-[1.35]"
                style={BODY_TEXT_STYLE}
                title={`${formatTime(entry.ts)} | ${author}: ${entry.text}`}
              >
                {entry.text}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function StickerPicker({
  packs,
  packIndex,
  onPackChange,
  onSelectSticker,
}: {
  packs: StickerPack[];
  packIndex: number;
  onPackChange: (index: number) => void;
  onSelectSticker: (url: string) => void;
}) {
  const activePack = packs[packIndex];

  return (
    <div
      className="absolute inset-x-0 bottom-[54px] z-10 overflow-hidden rounded-[10px] border"
      style={{
        maxHeight: 'calc(100% - 108px)',
        ...PANEL_BORDER_STYLE,
      }}
    >
      {packs.length > 1 && (
        <div className="flex gap-[3px] border-b p-2" style={{ borderColor: GAME_BOARD_COLORS.border }}>
          {packs.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onPackChange(index)}
              className="rounded-[8px] px-2 py-1 text-[14px] font-semibold uppercase tracking-[0.16em]"
              style={getStickerPackStyle(index === packIndex)}
            >
              {pack.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-[4px] overflow-y-auto p-2" style={{ maxHeight: '240px' }}>
        {activePack?.stickers.map((file, index) => (
          <StickerCell
            key={`${activePack.id}-${file}`}
            packId={activePack.id}
            file={file}
            index={index}
            onSelect={onSelectSticker}
          />
        ))}
      </div>
    </div>
  );
}

function Composer({
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
}: {
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
}) {
  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-[3px]">
      <div
        className="relative h-12 min-h-0 rounded-[10px] border"
        style={PANEL_BORDER_STYLE}
      >
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-full min-h-0 w-full resize-none bg-transparent py-[14px] pl-3 pr-12 text-[15px] leading-tight outline-none"
          maxLength={128}
          style={{ color: GAME_BOARD_COLORS.text }}
        />
        <button
          type="button"
          onClick={onToggleStickers}
          className="absolute right-[4px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[8px] p-0"
          style={{
            backgroundColor: showStickers ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
            color: showStickers ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
          }}
          title={stickersLabel}
          aria-label={openStickersLabel}
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="7.5" cy="8" r="1" fill="currentColor" />
            <circle cx="12.5" cy="8" r="1" fill="currentColor" />
            <path d="M7 12c1 1 5 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

        <button
          type="button"
          onClick={onSend}
          className="flex h-12 min-w-12 items-center justify-center rounded-[10px] border px-3 text-center text-[13px] font-bold uppercase tracking-[0.06em] leading-none"
          style={{
            backgroundColor: BOARD_TILE_COLORS.propertyYellow,
            borderColor: BOARD_TILE_COLORS.propertyOrange,
            color: BOARD_TILE_COLORS.altText,
        }}
      >
        {sendLabel}
      </button>
    </div>
  );
}

export function ChatWindow({
  log,
  initialMessages = [],
  externalMessages,
  viewerToken,
  onSendMessage,
  onSendSticker,
}: ChatWindowProps) {
  const t = useTranslations('Chat');
  const [activeTab, setActiveTab] = useState<ChatWindowTab>(ChatWindowTab.CHAT);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [unreadCount, setUnreadCount] = useState(initialMessages.length);
  const [showStickers, setShowStickers] = useState(false);
  const [packIndex, setPackIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickerPacks = useStickerPacks();

  const eventEntries = useMemo(
    () => log.filter((entry) => entry.kind === LogKind.EVENT),
    [log],
  );
  const deferredMessages = useDeferredValue(messages);
  const activeEntries = activeTab === ChatWindowTab.EVENTS ? eventEntries : deferredMessages;

  useEffect(() => {
    if (!externalMessages?.length) return;

    setMessages((current) => {
      const existingIds = new Set(current.map((message) => message.id));
      const incoming = externalMessages.filter((message) => !existingIds.has(message.id));
      if (incoming.length === 0) return current;

      const matchedLocalIds = new Set<string>();
      for (const message of incoming) {
        if (message.author !== 'You') continue;

        const localMatch = current.find((candidate) => (
          (candidate.id.startsWith('local-') || candidate.id.startsWith('sticker-')) &&
          candidate.author === 'You' &&
          candidate.text === message.text &&
          Math.abs(candidate.ts - message.ts) < 30_000
        ));

        if (localMatch) {
          matchedLocalIds.add(localMatch.id);
        }
      }

      const retainedLocal = current.filter((message) => (
        (message.id.startsWith('local-') || message.id.startsWith('sticker-')) &&
        !matchedLocalIds.has(message.id)
      ));

      if (activeTab !== ChatWindowTab.CHAT) {
        setUnreadCount((count) => count + incoming.filter((message) => message.author !== 'You').length);
      }

      return [...externalMessages, ...retainedLocal].sort((a, b) => a.ts - b.ts);
    });
  }, [activeTab, externalMessages]);

  useEffect(() => {
    if (activeTab === ChatWindowTab.CHAT) {
      setUnreadCount(0);
    }
  }, [activeTab]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, eventEntries.length, deferredMessages.length]);

  function handleSend() {
    const text = clampMessage(draft.trim());
    if (!text) return;

    const nextMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      kind: 'chat',
      author: 'You',
      token: viewerToken,
      text,
      ts: Date.now(),
    };

    setMessages((current) => [...current, nextMessage]);
    if (activeTab !== ChatWindowTab.CHAT) {
      setUnreadCount((count) => count + 1);
    }
    setDraft('');
    onSendMessage?.(text);
  }

  function handleSticker(url: string) {
    const nextMessage: ChatMessage = {
      id: `sticker-${Date.now()}`,
      kind: 'chat',
      author: 'You',
      token: viewerToken,
      text: `[sticker:${url}]`,
      ts: Date.now(),
    };

    setMessages((current) => [...current, nextMessage]);
    if (activeTab !== ChatWindowTab.CHAT) {
      setUnreadCount((count) => count + 1);
    }
    setShowStickers(false);
    onSendSticker?.(url);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <section
      className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_48px] gap-[3px]"
      style={{ color: GAME_BOARD_COLORS.text }}
    >
      <ChatTabs
        activeTab={activeTab}
        unreadCount={unreadCount}
        onTabChange={setActiveTab}
        eventsLabel={t('gameEvents')}
        chatLabel={t('chat')}
      />

      <div
        className="min-h-0 overflow-hidden rounded-[10px] border"
        style={PANEL_BORDER_STYLE}
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto p-[3px]">
          {activeEntries.length === 0 ? (
            <EmptyState label={activeTab === ChatWindowTab.EVENTS ? t('noEventsYet') : t('noMessagesYet')} />
          ) : activeTab === ChatWindowTab.EVENTS ? (
            <EventEntries entries={eventEntries} tableLabel={t('table')} />
          ) : (
            <MessageEntries
              entries={deferredMessages}
              playerLabel={t('player')}
              stickerAlt={t('stickerAlt')}
            />
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <Composer
        draft={draft}
        showStickers={showStickers}
        placeholder={t('messagePlaceholder')}
        stickersLabel={t('stickers')}
        openStickersLabel={t('openStickers')}
        sendLabel={t('send')}
        onDraftChange={(value) => setDraft(clampMessage(value))}
        onKeyDown={handleKeyDown}
        onToggleStickers={() => setShowStickers((value) => !value)}
        onSend={handleSend}
      />

      {showStickers && (
        <StickerPicker
          packs={stickerPacks}
          packIndex={packIndex}
          onPackChange={setPackIndex}
          onSelectSticker={handleSticker}
        />
      )}
    </section>
  );
}
