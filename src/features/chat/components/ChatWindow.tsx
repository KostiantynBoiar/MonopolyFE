'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { ChatWindowTab } from '../chat.enums';
import type { ChatWindowProps, StickerPack } from '../chat.types';

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

function StickerCell({ url, file, index, onSelect }: { url: string; file: string; index: number; onSelect: () => void }) {
  const isTgs = file.endsWith('.tgs');
  const [mounted, setMounted] = useState(!isTgs);

  useEffect(() => {
    if (!isTgs) return;
    const timer = setTimeout(() => setMounted(true), index * 20);
    return () => clearTimeout(timer);
  }, [index, isTgs]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-[60px] w-[60px] items-center justify-center rounded-[8px] border"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {isTgs
        ? (mounted ? <TgsPlayer src={url} size={45} loop={false} /> : <div style={{ width: 45, height: 45 }} />)
        : <img src={url} alt={file} className="h-[45px] w-[45px] object-contain" />}
    </button>
  );
}

export function ChatWindow({ log, messages = [], onSendMessage, onSendSticker }: ChatWindowProps) {
  const [activeTab, setActiveTab] = useState<ChatWindowTab>(ChatWindowTab.CHAT);
  const [draft, setDraft] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [packIndex, setPackIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(messages.length);
  const stickerPacks = useStickerPacks();

  const eventEntries = useMemo(
    () => log.filter((entry) => entry.kind === LogKind.EVENT),
    [log],
  );
  const activePack = stickerPacks[packIndex];

  // Messages now arrive over the socket (every player's, incl. the sender's own echo) —
  // we render them reactively instead of keeping a local optimistic copy. Bump the unread
  // badge when new ones land while the Events tab is open.
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && activeTab !== ChatWindowTab.CHAT) {
      setUnreadCount((count) => count + (messages.length - prevMsgCountRef.current));
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, activeTab]);

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
                        <img src={stickerUrl} alt="Sticker" className="h-20 w-20 max-w-full object-contain" />
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
          className="absolute bottom-[57px] left-[calc(100%-51px)] z-10 w-[214px] -translate-x-full overflow-hidden rounded-[10px] border"
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
          <div className="grid max-h-[280px] grid-cols-3 gap-[4px] overflow-y-auto p-2">
            {activePack?.stickers.map((file, index) => {
              const url = `/stickers/${activePack.id}/${file}`;
              return (
                <StickerCell
                  key={`${activePack.id}-${file}`}
                  url={url}
                  file={file}
                  index={index}
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
