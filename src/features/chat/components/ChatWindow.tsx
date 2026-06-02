'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { ChatWindowTab } from '../chat.enums';
import type { ChatMessage, ChatWindowProps, StickerPack } from '../chat.types';

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

function StickerPreview({ url, alt, size, loop = true }: { url: string; alt: string; size: number; loop?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (isTgsSticker(url)) {
    return (
      <TgsPlayer
        src={url}
        size={size}
        loop={loop}
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

function StickerCell({ url, file, onSelect }: { url: string; file: string; onSelect: () => void }) {
  const isTgs = isTgsSticker(file);
  const [previewActive, setPreviewActive] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-[60px] w-[60px] items-center justify-center rounded-[8px] border"
      onBlur={() => setPreviewActive(false)}
      onFocus={() => setPreviewActive(true)}
      onPointerEnter={() => setPreviewActive(true)}
      onPointerLeave={() => setPreviewActive(false)}
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {isTgs && !previewActive
        ? <StickerFallback size={45} />
        : <StickerPreview url={url} alt={file} size={45} loop={false} />}
    </button>
  );
}

export function ChatWindow({ log, initialMessages = [], externalMessages, viewerToken, onSendMessage, onSendSticker }: ChatWindowProps) {
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
  const activePack = stickerPacks[packIndex];

  useEffect(() => {
    if (!externalMessages?.length) return;
    setMessages((current) => {
      const existingIds = new Set(current.map((m) => m.id));
      const incoming = externalMessages.filter((m) => !existingIds.has(m.id));
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
        setUnreadCount((n) => n + incoming.filter((message) => message.author !== 'You').length);
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
  }, [activeTab, eventEntries.length, messages.length]);

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

  const activeEntries = activeTab === ChatWindowTab.EVENTS ? eventEntries : messages;

  return (
    <section
      className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_48px] gap-[3px]"
      style={{ color: GAME_BOARD_COLORS.text }}
    >
      <header
        className="grid grid-cols-[3fr_1fr] gap-[3px]"
      >
        <button
          type="button"
          className="flex min-h-0 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-center font-display text-[14px] font-semibold uppercase tracking-[0.16em]"
          style={{
            backgroundColor:
              activeTab === ChatWindowTab.EVENTS ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
            color:
              activeTab === ChatWindowTab.EVENTS ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
            borderColor: GAME_BOARD_COLORS.border,
          }}
          onClick={() => setActiveTab(ChatWindowTab.EVENTS)}
        >
          <span>Game Events</span>
        </button>

        <button
          type="button"
          className="flex min-h-0 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-center font-display text-[14px] font-semibold uppercase tracking-[0.16em]"
          style={{
            backgroundColor:
              activeTab === ChatWindowTab.CHAT ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
            color:
              activeTab === ChatWindowTab.CHAT ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
            borderColor: GAME_BOARD_COLORS.border,
          }}
          onClick={() => setActiveTab(ChatWindowTab.CHAT)}
        >
          <span>Chat</span>
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

      <div
        className="min-h-0 overflow-hidden rounded-[10px] border"
        style={{
          borderColor: GAME_BOARD_COLORS.border,
          backgroundColor: GAME_BOARD_COLORS.surface,
        }}
      >
        <div className="flex h-full min-h-0 flex-col overflow-y-auto p-[3px]">
          {activeEntries.length === 0 ? (
            <div
              className="flex h-full items-center justify-center rounded-[8px] text-center text-[15px]"
              style={{ color: GAME_BOARD_COLORS.muted }}
            >
              {activeTab === ChatWindowTab.EVENTS ? 'No events yet.' : 'No messages yet.'}
            </div>
          ) : activeTab === ChatWindowTab.EVENTS ? (
            <div className="grid gap-[3px]">
              {eventEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="grid min-w-0 gap-[1px] rounded-[8px] px-2 py-1.5"
                  style={{ backgroundColor: GAME_BOARD_COLORS.surface }}
                >
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: GAME_BOARD_COLORS.muted }}>
                    {formatTime(new Date(entry.ts).getTime())}
                  </p>
                  <p
                    className="min-w-0 whitespace-pre-wrap text-center text-[15px] leading-[1.35]"
                    style={{ color: GAME_BOARD_COLORS.text, overflowWrap: 'anywhere' }}
                  >
                    <span className="font-semibold">{entry.playerName ?? 'Table'}</span>
                    {': '}
                    {entry.text}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-[3px]">
              {messages.map((entry) => {
                const stickerUrl = getStickerUrl(entry.text);

                return (
                  <article
                    key={entry.id}
                    className="grid min-w-0 gap-[2px] rounded-[8px] px-2 py-1.5"
                    style={{ backgroundColor: GAME_BOARD_COLORS.surface }}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[13px] uppercase tracking-[0.12em]" style={{ color: GAME_BOARD_COLORS.muted }}>
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
                        {entry.author ?? 'Player'}
                      </span>
                    </div>
                    {stickerUrl ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <StickerPreview url={stickerUrl} alt="Sticker" size={80} />
                      </div>
                    ) : (
                      <p
                        className="min-w-0 whitespace-pre-wrap text-left text-[15px] leading-[1.35]"
                        style={{ color: GAME_BOARD_COLORS.text, overflowWrap: 'anywhere' }}
                        title={`${formatTime(entry.ts)} | ${entry.author ?? 'Player'}: ${entry.text}`}
                      >
                        {entry.text}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div
        className="grid min-h-0 grid-cols-[minmax(0,1fr)_48px] gap-[3px]"
        style={{
          color: GAME_BOARD_COLORS.text,
        }}
      >
        <div
          className="relative h-12 min-h-0 rounded-[10px] border"
          style={{
            backgroundColor: GAME_BOARD_COLORS.surface,
            borderColor: GAME_BOARD_COLORS.border,
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(clampMessage(event.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="h-full min-h-0 w-full resize-none bg-transparent pl-3 pr-12 py-[14px] text-[15px] leading-tight outline-none"
            maxLength={128}
            style={{
              color: GAME_BOARD_COLORS.text,
            }}
          />
          <button
            type="button"
            onClick={() => setShowStickers((value) => !value)}
            className="absolute right-[4px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[8px] p-0"
            style={{
              backgroundColor: showStickers ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
              color: showStickers ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
            }}
            title="Stickers"
            aria-label="Open stickers"
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
          onClick={handleSend}
          className="flex h-12 w-12 items-center justify-center rounded-[10px] border text-[13px] font-bold uppercase tracking-[0.06em]"
          style={{
            backgroundColor: BOARD_TILE_COLORS.propertyYellow,
            borderColor: BOARD_TILE_COLORS.propertyOrange,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          Send
        </button>
      </div>
      {showStickers && (
        <div
          className="absolute bottom-[57px] left-[calc(100%-51px)] z-10 w-[324px] -translate-x-full overflow-hidden rounded-[10px] border"
          style={{
            backgroundColor: GAME_BOARD_COLORS.surface,
            borderColor: GAME_BOARD_COLORS.border,
          }}
        >
          {stickerPacks.length > 1 && (
            <div className="flex gap-[3px] border-b p-2" style={{ borderColor: GAME_BOARD_COLORS.border }}>
              {stickerPacks.map((pack, index) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setPackIndex(index)}
                  className="rounded-[8px] px-2 py-1 text-[14px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    backgroundColor: index === packIndex ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
                    color: index === packIndex ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
                  }}
                >
                  {pack.name}
                </button>
              ))}
            </div>
          )}
          <div className="grid max-h-[280px] grid-cols-5 gap-[4px] overflow-y-auto p-2">
            {activePack?.stickers.map((file) => {
              const url = `/stickers/${activePack.id}/${file}`;
              return (
                <StickerCell
                  key={`${activePack.id}-${file}`}
                  url={url}
                  file={file}
                  onSelect={() => handleSticker(url)}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
