'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { useBoardTileName } from '@/features/game-board/board-tile-name';
import { LogKind } from '@/shared/protocol/game-state.enums';
import { clampMessage, dedupeAndSortChatMessages } from '../chat.utils';
import { ChatWindowTab } from '../chat.enums';
import type { ChatWindowProps, StickerPack } from '../chat.types';
import { TRANSCRIPT_TEXTURE } from '../chat.constants';
import { ChatTabs } from './ChatTabs';
import { EmptyState } from './EmptyState';
import { EventEntries } from './EventEntries';
import { MessageEntries } from './MessageEntries';
import { Composer } from './Composer';
import { StickerPicker } from './StickerPicker';

const C = GAME_BOARD_COLORS;

function useStickerPacks() {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  useEffect(() => {
    fetch('/stickers/manifest.json')
      .then((r) => r.json())
      .then((data) => setPacks(data.packs ?? []))
      .catch(() => {});
  }, []);
  return packs;
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
  const scrollRef    = useRef<HTMLDivElement>(null);
  const stickerPacks = useStickerPacks();

  const eventEntries = useMemo(
    () => log.filter((e) => e.kind === LogKind.EVENT),
    [log],
  );

  const displayMessages = useMemo(
    () => dedupeAndSortChatMessages(externalMessages),
    [externalMessages],
  );

  const prevChatLenRef = useRef(displayMessages.length);
  useEffect(() => {
    if (displayMessages.length > prevChatLenRef.current && activeTab !== ChatWindowTab.CHAT) {
      setUnreadCount((c) => c + (displayMessages.length - prevChatLenRef.current));
    }
    prevChatLenRef.current = displayMessages.length;
  }, [displayMessages.length, activeTab]);

  useEffect(() => {
    if (activeTab !== ChatWindowTab.CHAT) return;
    const id = window.setTimeout(() => setUnreadCount(0), 0);
    return () => window.clearTimeout(id);
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
