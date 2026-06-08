'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { useBoardTileName } from '@/features/game-board';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { renderGameEvent } from '@/shared/protocol/log';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { ChatWindowTab } from '../chat.enums';
import type { ChatMessage, ChatWindowProps, StickerPack } from '../chat.types';

const C = GAME_BOARD_COLORS;
const T = BOARD_TILE_COLORS;

const PANEL_BORDER_STYLE = {
  borderColor: C.border,
  backgroundColor: C.surface,
} as const;

// Faint paper-dot texture for the transcript, so empty space still feels like a surface.
const TRANSCRIPT_TEXTURE = {
  backgroundColor: C.panel,
  backgroundImage: `radial-gradient(${C.border} 0.5px, transparent 0.5px)`,
  backgroundSize: '14px 14px',
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

function getActiveStyle(isActive: boolean) {
  return {
    backgroundColor: isActive ? T.propertyBlue : C.surface,
    color: isActive ? T.altText : C.text,
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
        backgroundColor: C.panel,
        borderColor: C.border,
        color: C.muted,
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
    // eslint-disable-next-line @next/next/no-img-element -- remote sticker URL with onError fallback; next/image doesn't fit
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
      className="flex w-full aspect-square items-center justify-center rounded-[10px] border transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
      style={PANEL_BORDER_STYLE}
    >
      {isTgs && !mounted
        ? <StickerFallback size={44} />
        : <StickerPreview url={url} alt={file} size={44} loop={false} autoplay={false} />}
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
  const isChat = activeTab === ChatWindowTab.CHAT;
  const tabClass =
    'relative z-10 flex min-h-0 items-center justify-center gap-2 rounded-[9px] py-2 text-center font-display text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200';

  return (
    <header
      className="relative grid grid-cols-2 rounded-[12px] border p-[3px]"
      style={{ borderColor: C.border, backgroundColor: C.panel }}
    >
      {/* Sliding active indicator */}
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
        className={tabClass}
        style={{ color: isChat ? C.muted : C.text }}
        onClick={() => onTabChange(ChatWindowTab.EVENTS)}
      >
        {eventsLabel}
      </button>

      <button
        type="button"
        className={tabClass}
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

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 text-center"
      style={{ color: C.muted }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 opacity-40">
        <path
          d="M4 5h16v11H8l-4 3.5V5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

function EventEntries({
  entries,
  tLog,
  resolveTileName,
  resolveCardText,
}: {
  entries: ChatWindowProps['log'];
  tLog: (key: string, values?: Record<string, string | number>) => string;
  resolveTileName: (position: number) => string;
  resolveCardText: (cardId: string, cardKind: string) => string;
}) {
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
              {formatTime(new Date(entry.ts).getTime())}
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

function isOwnMessage(message: ChatMessage, viewerUserId?: string) {
  return Boolean(viewerUserId && message.fromUserId === viewerUserId);
}

function sameSender(a: ChatMessage, b: ChatMessage) {
  // Group by sender identity. Prefer user id; fall back to author label for
  // log-sourced entries that carry no user id.
  const keyA = a.fromUserId ?? `name:${a.author ?? ''}`;
  const keyB = b.fromUserId ?? `name:${b.author ?? ''}`;
  return keyA === keyB;
}

function MessageEntries({
  entries,
  viewerUserId,
  playerLabel,
  youLabel,
  stickerAlt,
}: {
  entries: ChatMessage[];
  viewerUserId?: string;
  playerLabel: string;
  youLabel: string;
  stickerAlt: string;
}) {
  return (
    <div className="flex flex-col px-1.5 py-1">
      {entries.map((entry, i) => {
        const prev = entries[i - 1];
        const next = entries[i + 1];
        const own = isOwnMessage(entry, viewerUserId);
        const firstOfRun = !prev || !sameSender(prev, entry);
        const lastOfRun = !next || !sameSender(next, entry);

        const stickerUrl = getStickerUrl(entry.text);
        const author = own ? youLabel : entry.author ?? playerLabel;
        const tokenColor = entry.token ? TOKEN_COLORS[entry.token] : C.muted;

        // Connected-stack corners: tail only on the last bubble of a run,
        // and the inner corner tightens when stacked under the same sender.
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
                  title={`${formatTime(entry.ts)} | ${author}`}
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
                    {formatTime(entry.ts)}
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
      className="absolute inset-x-0 bottom-[54px] top-0 z-30 flex flex-col rounded-[14px] border"
      style={{
        boxShadow: '0 8px 24px rgba(51,48,43,0.18)',
        ...PANEL_BORDER_STYLE,
      }}
    >
      {packs.length > 1 && (
        <div className="flex shrink-0 gap-[4px] border-b p-2" style={{ borderColor: C.border }}>
          {packs.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onPackChange(index)}
              className="rounded-full border px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors"
              style={{ ...getActiveStyle(index === packIndex), borderColor: C.border }}
            >
              {pack.name}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 gap-[2px] p-1.5">
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

export function ChatWindow({
  log,
  externalMessages,
  viewerUserId,
  onSendMessage,
  onSendSticker,
}: ChatWindowProps) {
  const t     = useTranslations('Chat');
  const tLog  = useTranslations('EventLog') as unknown as (key: string, values?: Record<string, string | number>) => string;
  const tCard = useTranslations('Card') as unknown as (key: string) => string;

  const resolveTileName = useBoardTileName();
  const resolveCardText = (cardId: string, cardKind: string): string => {
    try {
      return tCard(`cards.${cardKind}.${cardId}`);
    } catch {
      return cardId;
    }
  };

  const [activeTab,    setActiveTab]    = useState<ChatWindowTab>(ChatWindowTab.CHAT);
  const [draft,        setDraft]        = useState('');
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [packIndex,    setPackIndex]    = useState(0);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const stickerPacks = useStickerPacks();

  const eventEntries = useMemo(
    () => log.filter((e) => e.kind === LogKind.EVENT),
    [log],
  );

  // Chat is sourced entirely from the client-persisted store (passed in as
  // externalMessages) — the backend doesn't persist chat, so the game log carries none.
  // Dedup by id and order by timestamp.
  const displayMessages = useMemo(() => {
    const seen = new Set<string>();
    return (externalMessages ?? [])
      .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
      .sort((a, b) => a.ts - b.ts);
  }, [externalMessages]);

  // Unread badge: count new chat messages that arrive while not on the Chat tab.
  const prevChatLenRef = useRef(displayMessages.length);
  useEffect(() => {
    if (displayMessages.length > prevChatLenRef.current && activeTab !== ChatWindowTab.CHAT) {
      setUnreadCount((c) => c + (displayMessages.length - prevChatLenRef.current));
    }
    prevChatLenRef.current = displayMessages.length;
  }, [displayMessages.length, activeTab]);

  useEffect(() => {
    if (activeTab === ChatWindowTab.CHAT) setUnreadCount(0);
  }, [activeTab]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, eventEntries.length, displayMessages.length]);


  function handleSend() {
    const text = clampMessage(draft.trim());
    if (!text) return;
    setDraft('');
    onSendMessage?.(text);
  }

  function handleSticker(url: string) {
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
      className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_48px] gap-[6px]"
      style={{ color: C.text }}
    >
      <style>{`@keyframes chatBubbleIn{from{opacity:0;transform:translateY(6px) scale(0.985)}to{opacity:1;transform:none}}`}</style>

      <ChatTabs
        activeTab={activeTab}
        unreadCount={unreadCount}
        onTabChange={setActiveTab}
        eventsLabel={t('gameEvents')}
        chatLabel={t('chat')}
      />

      <div
        className="min-h-0 overflow-hidden rounded-[12px] border"
        style={{ borderColor: C.border }}
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto" style={TRANSCRIPT_TEXTURE}>
          {activeTab === ChatWindowTab.EVENTS ? (
            eventEntries.length === 0
              ? <EmptyState label={t('noEventsYet')} />
              : <EventEntries
                  entries={eventEntries}
                  tLog={tLog}
                  resolveTileName={resolveTileName}
                  resolveCardText={resolveCardText}
                />
          ) : (
            displayMessages.length === 0
              ? <EmptyState label={t('noMessagesYet')} />
              : <MessageEntries
                  entries={displayMessages}
                  viewerUserId={viewerUserId}
                  playerLabel={t('player')}
                  youLabel={t('you')}
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
        onToggleStickers={() => setShowStickers((v) => !v)}
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
