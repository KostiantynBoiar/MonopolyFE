'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TOKEN_COLORS } from '@/features/player-panel';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { LogKind, TokenColor } from '@/shared/protocol/game-state.enums';
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
      className="flex h-12 w-12 items-center justify-center rounded-[8px] border"
      style={{
        backgroundColor: GAME_BOARD_COLORS.boardField,
        borderColor: GAME_BOARD_COLORS.tileBorder,
      }}
    >
      {isTgs
        ? (mounted ? <TgsPlayer src={url} size={36} loop={false} /> : <div style={{ width: 36, height: 36 }} />)
        : <img src={url} alt={file} className="h-9 w-9 object-contain" />}
    </button>
  );
}

export function ChatWindow({ log, initialMessages = [], onSendMessage, onSendSticker }: ChatWindowProps) {
  const [activeTab, setActiveTab] = useState<ChatWindowTab>(ChatWindowTab.EVENTS);
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
    if (activeTab === ChatWindowTab.CHAT) {
      setUnreadCount(0);
    }
  }, [activeTab]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, eventEntries.length, messages.length]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    const nextMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      kind: 'chat',
      author: 'You',
      token: TokenColor.BLUE,
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
      token: TokenColor.BLUE,
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
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <section
      className="grid h-full min-h-0 overflow-hidden rounded-[12px] border"
      style={{
        gridTemplateRows: 'calc(100% / 12) minmax(0, 1fr) calc(100% / 6)',
        backgroundColor: GAME_BOARD_COLORS.tileSurface,
        borderColor: GAME_BOARD_COLORS.tileBorder,
        color: GAME_BOARD_COLORS.tileText,
        boxShadow: `0 8px 18px ${GAME_BOARD_COLORS.boardShadow}`,
      }}
    >
      <header
        className="grid min-h-0 grid-cols-2 border-b"
        style={{ borderColor: GAME_BOARD_COLORS.tileBorder }}
      >
        <button
          type="button"
          className="flex items-start justify-center gap-2 border-r px-3 pt-2 text-center font-display text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{
            backgroundColor:
              activeTab === ChatWindowTab.EVENTS ? GAME_BOARD_COLORS.boardCenter : 'transparent',
            color:
              activeTab === ChatWindowTab.EVENTS ? GAME_BOARD_COLORS.boardCenterText : GAME_BOARD_COLORS.tileText,
            borderColor: GAME_BOARD_COLORS.tileBorder,
          }}
          onClick={() => setActiveTab(ChatWindowTab.EVENTS)}
        >
          <span>Game Events</span>
        </button>

        <button
          type="button"
          className="flex items-start justify-center gap-2 px-3 pt-2 text-center font-display text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{
            backgroundColor:
              activeTab === ChatWindowTab.CHAT ? GAME_BOARD_COLORS.boardCenter : 'transparent',
            color:
              activeTab === ChatWindowTab.CHAT ? GAME_BOARD_COLORS.boardCenterText : GAME_BOARD_COLORS.tileText,
          }}
          onClick={() => setActiveTab(ChatWindowTab.CHAT)}
        >
          <span>Chat</span>
          {unreadCount > 0 && (
            <span
              className="flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
              style={{
                backgroundColor: GAME_BOARD_COLORS.symbolTax,
                color: GAME_BOARD_COLORS.boardCenterText,
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      <div className="min-h-0 overflow-hidden border-b px-2 py-2" style={{ borderColor: GAME_BOARD_COLORS.tileBorder }}>
        {activeTab === ChatWindowTab.EVENTS ? (
          <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
            {eventEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[8px] border px-2 py-1.5"
                style={{
                  backgroundColor: GAME_BOARD_COLORS.railroadSurface,
                  borderColor: GAME_BOARD_COLORS.tileBorder,
                }}
              >
                <p
                  className="truncate text-left text-[12px]"
                  style={{ color: GAME_BOARD_COLORS.tileText }}
                  title={`${formatTime(new Date(entry.ts).getTime())} | ${entry.playerName ?? 'Table'}: ${entry.text}`}
                >
                  {formatTime(new Date(entry.ts).getTime())} | {entry.playerName ?? 'Table'}: {entry.text}
                </p>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
            {messages.map((entry) => {
              const stickerUrl = getStickerUrl(entry.text);

              return (
                <div
                  key={entry.id}
                  className="rounded-[8px] border px-2 py-1.5"
                  style={{
                    backgroundColor: GAME_BOARD_COLORS.boardField,
                    borderColor: GAME_BOARD_COLORS.tileBorder,
                  }}
                >
                  {stickerUrl ? (
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-[12px]" style={{ color: GAME_BOARD_COLORS.tileMuted }}>
                        {formatTime(entry.ts)} |
                      </span>
                      {entry.token && (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: TOKEN_COLORS[entry.token] }}
                        />
                      )}
                      <span
                        className="shrink-0 text-[12px] font-semibold"
                        style={{ color: entry.token ? TOKEN_COLORS[entry.token] : GAME_BOARD_COLORS.tileText }}
                      >
                        {entry.author ?? 'Player'}:
                      </span>
                      <img src={stickerUrl} alt="Sticker" className="h-16 w-16 shrink-0 object-contain" />
                    </div>
                  ) : (
                    <p
                      className="truncate text-left text-[12px]"
                      style={{ color: GAME_BOARD_COLORS.tileText }}
                      title={`${formatTime(entry.ts)} | ${entry.author ?? 'Player'}: ${entry.text}`}
                    >
                      <span style={{ color: GAME_BOARD_COLORS.tileMuted }}>
                        {formatTime(entry.ts)}
                      </span>
                      {' | '}
                      {entry.token && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full align-middle"
                          style={{ backgroundColor: TOKEN_COLORS[entry.token] }}
                        />
                      )}
                      {entry.token && ' '}
                      <span
                        className="font-semibold"
                        style={{ color: entry.token ? TOKEN_COLORS[entry.token] : GAME_BOARD_COLORS.tileText }}
                      >
                        {entry.author ?? 'Player'}
                      </span>
                      : {entry.text}
                    </p>
                  )}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <div
        className="relative grid min-h-0 grid-cols-[minmax(0,1fr)_40px_auto] gap-2 border-t px-3 py-2"
        style={{ borderColor: GAME_BOARD_COLORS.tileBorder }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="h-full min-h-0 resize-none rounded-[10px] border px-3 py-2 text-[12px] leading-tight outline-none"
          style={{
            backgroundColor: GAME_BOARD_COLORS.shell,
            borderColor: GAME_BOARD_COLORS.tileBorder,
            color: GAME_BOARD_COLORS.tileText,
          }}
        />
        <button
          type="button"
          onClick={() => setShowStickers((value) => !value)}
          className="flex h-full w-10 items-center justify-center rounded-[10px] border p-0"
          style={{
            backgroundColor: showStickers ? GAME_BOARD_COLORS.boardCenter : GAME_BOARD_COLORS.shell,
            borderColor: GAME_BOARD_COLORS.tileBorder,
            color: showStickers ? GAME_BOARD_COLORS.boardCenterText : GAME_BOARD_COLORS.tileText,
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
        <button
          type="button"
          onClick={handleSend}
          className="rounded-[10px] border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
          style={{
            backgroundColor: GAME_BOARD_COLORS.boardCenter,
            borderColor: GAME_BOARD_COLORS.tileBorder,
            color: GAME_BOARD_COLORS.boardCenterText,
          }}
        >
          Send
        </button>
        {showStickers && (
          <div
            className="absolute bottom-full left-3 z-10 mb-2 w-[236px] overflow-hidden rounded-[10px] border"
            style={{
              backgroundColor: GAME_BOARD_COLORS.tileSurface,
              borderColor: GAME_BOARD_COLORS.tileBorder,
              boxShadow: `0 8px 18px ${GAME_BOARD_COLORS.boardShadow}`,
            }}
          >
            {stickerPacks.length > 1 && (
              <div className="flex gap-1 border-b p-2" style={{ borderColor: GAME_BOARD_COLORS.tileBorder }}>
                {stickerPacks.map((pack, index) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setPackIndex(index)}
                    className="rounded-[8px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      backgroundColor: index === packIndex ? GAME_BOARD_COLORS.boardCenter : 'transparent',
                      color: index === packIndex ? GAME_BOARD_COLORS.boardCenterText : GAME_BOARD_COLORS.tileText,
                    }}
                  >
                    {pack.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid max-h-[220px] grid-cols-4 gap-2 overflow-y-auto p-2">
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
      </div>
    </section>
  );
}
