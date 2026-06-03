'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TOKEN_COLORS } from '@/shared/config/constants';
import type { GameEvent, LogEntry } from '@/shared/protocol/game-state';
import { GameEventType, LogKind } from '@/shared/protocol/game-state.enums';
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

type PlayerVisual = {
  color: string;
};

type EventLogTranslator = ReturnType<typeof useTranslations<'EventLog'>>;
type RichTranslationValues = Parameters<EventLogTranslator['rich']>[1];

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  return '';
}

function formatMoney(value: number) {
  return `M${value}`;
}

function PlayerEntity({
  label,
  visual,
}: {
  label: string;
  visual?: PlayerVisual;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 align-baseline">
      {visual && (
        <span
          className="mt-[1px] inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: visual.color }}
          aria-hidden="true"
        />
      )}
      <span style={{ color: visual?.color ?? GAME_BOARD_COLORS.text, fontWeight: 700 }}>
        {label}
      </span>
    </span>
  );
}

function PropertyEntity({ label }: { label: string }) {
  return (
    <span style={{ color: GAME_BOARD_COLORS.special, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function AmountEntity({ label }: { label: string }) {
  return <strong>{label}</strong>;
}

function renderLegacyEventText(
  text: string,
  playerVisuals: ReadonlyMap<string, PlayerVisual>,
): ReactNode {
  const tokens = [...playerVisuals.keys()]
    .sort((a, b) => b.length - a.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const pattern = tokens.length > 0
    ? new RegExp(`(${tokens.join('|')}|M\\d+)`, 'g')
    : /(M\d+)/g;

  return text.split(pattern).map((part, index) => {
    if (!part) return null;

    const visual = playerVisuals.get(part);
    if (visual) {
      return <PlayerEntity key={`${part}-${index}`} label={part} visual={visual} />;
    }

    if (/^M\d+$/.test(part)) {
      return <AmountEntity key={`${part}-${index}`} label={part} />;
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderEventContent(
  entry: LogEntry,
  t: EventLogTranslator,
  playerVisuals: ReadonlyMap<string, PlayerVisual>,
): ReactNode {
  if (!entry.event) return renderLegacyEventText(entry.text.replace(/\$(\d+)/g, 'M$1'), playerVisuals);

  const richValues = {
    player: (chunks: ReactNode) => <PlayerEntity label={nodeText(chunks)} visual={playerVisuals.get(nodeText(chunks))} />,
    property: (chunks: ReactNode) => <PropertyEntity label={nodeText(chunks)} />,
    amount: (chunks: ReactNode) => <AmountEntity label={nodeText(chunks)} />,
  };

  return renderLocalizedEvent(entry.event, t, richValues, playerVisuals);
}

function renderLocalizedEvent(
  event: GameEvent,
  t: EventLogTranslator,
  richValues: RichTranslationValues,
  playerVisuals: ReadonlyMap<string, PlayerVisual>,
): ReactNode {
  switch (event.type) {
    case GameEventType.TurnStarted:
      return t.rich('turn_started', { ...richValues, playerName: event.playerName });
    case GameEventType.RoundStarted:
      return t.rich('round_started', { roundNumber: event.roundNumber });
    case GameEventType.DiceRolled:
      return t.rich('dice_rolled', {
        ...richValues,
        playerName: event.playerName,
        die1: event.die1,
        die2: event.die2,
        total: event.die1 + event.die2,
        doubles: event.isDoubles ? 'yes' : 'no',
      });
    case GameEventType.PlayerMoved:
      return t.rich('player_moved', { ...richValues, playerName: event.playerName, toName: event.toName });
    case GameEventType.PassedGo:
      return t.rich('passed_go', { ...richValues, playerName: event.playerName, amount: formatMoney(event.amount) });
    case GameEventType.PropertyBought:
      return t.rich('property_bought', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        price: formatMoney(event.price),
      });
    case GameEventType.PropertySold:
      return t.rich('property_sold', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        refund: formatMoney(event.refund),
      });
    case GameEventType.RentPaid:
      return t.rich('rent_paid', {
        ...richValues,
        payerName: event.payerName,
        ownerName: event.ownerName,
        propertyName: event.propertyName,
        amount: formatMoney(event.amount),
      });
    case GameEventType.TaxPaid:
      return t.rich('tax_paid', {
        ...richValues,
        playerName: event.playerName,
        taxName: event.taxName,
        amount: formatMoney(event.amount),
      });
    case GameEventType.CardDrawn:
      return t.rich('card_drawn', { ...richValues, playerName: event.playerName, text: event.text });
    case GameEventType.CardResolved:
      return renderLegacyEventText(event.text.replace(/\$(\d+)/g, 'M$1'), playerVisuals);
    case GameEventType.SentToJail:
      return t.rich('sent_to_jail', { ...richValues, playerName: event.playerName });
    case GameEventType.LeftJail:
      return t.rich('left_jail', { ...richValues, playerName: event.playerName, method: event.method });
    case GameEventType.HouseBuilt:
      return t.rich('house_built', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        cost: formatMoney(event.cost),
      });
    case GameEventType.HotelBuilt:
      return t.rich('hotel_built', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        cost: formatMoney(event.cost),
      });
    case GameEventType.HouseSold:
      return t.rich('house_sold', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        refund: formatMoney(event.refund),
      });
    case GameEventType.HotelSold:
      return t.rich('hotel_sold', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        refund: formatMoney(event.refund),
      });
    case GameEventType.Mortgaged:
      return t.rich('mortgaged', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        amount: formatMoney(event.amount),
      });
    case GameEventType.Unmortgaged:
      return t.rich('unmortgaged', {
        ...richValues,
        playerName: event.playerName,
        propertyName: event.propertyName,
        cost: formatMoney(event.cost),
      });
    case GameEventType.AuctionStarted:
      return t.rich('auction_started', { ...richValues, propertyName: event.propertyName });
    case GameEventType.AuctionBid:
      return t.rich('auction_bid', { ...richValues, playerName: event.playerName, amount: formatMoney(event.amount) });
    case GameEventType.AuctionWon:
      return t.rich('auction_won', {
        ...richValues,
        haswinner: event.winnerId ? 'yes' : 'no',
        winnerName: event.winnerName,
        amount: formatMoney(event.amount),
      });
    case GameEventType.TradeProposed:
      return t.rich('trade_proposed', {
        ...richValues,
        proposerName: event.proposerName,
        targetName: event.targetName,
      });
    case GameEventType.TradeResolved:
      return t.rich('trade_resolved', { accepted: event.accepted ? 'yes' : 'no' });
    case GameEventType.DebtIncurred:
      return t.rich('debt_incurred', {
        ...richValues,
        debtorName: event.debtorName,
        amount: formatMoney(event.amount),
      });
    case GameEventType.Bankrupted:
      return t.rich('bankrupted', { ...richValues, playerName: event.playerName });
    case GameEventType.GameOver:
      return t.rich('game_over', { ...richValues, winnerName: event.winnerName });
  }
}

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

function getActiveStyle(isActive: boolean, withBorder = false) {
  return {
    backgroundColor: isActive ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.surface,
    color: isActive ? BOARD_TILE_COLORS.altText : GAME_BOARD_COLORS.text,
    ...(withBorder ? { borderColor: GAME_BOARD_COLORS.border } : {}),
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
        style={getActiveStyle(activeTab === ChatWindowTab.EVENTS, true)}
        onClick={() => onTabChange(ChatWindowTab.EVENTS)}
      >
        <span>{eventsLabel}</span>
      </button>

      <button
        type="button"
        className={TAB_BUTTON_CLASS}
        style={getActiveStyle(activeTab === ChatWindowTab.CHAT, true)}
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
  eventT,
  playerVisuals,
}: {
  entries: ChatWindowProps['log'];
  eventT: EventLogTranslator;
  playerVisuals: ReadonlyMap<string, PlayerVisual>;
}) {
  return (
    <div className="flex flex-col gap-[2px] py-1">
      {entries.map((entry) => {
        return (
          <div
            key={entry.id}
            className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 px-2 py-0.5 text-[13.5px] leading-snug"
            style={{ color: GAME_BOARD_COLORS.text }}
          >
            <span
              className="shrink-0 font-mono text-[11px]"
              style={TIMESTAMP_TEXT_STYLE}
            >
              [{formatTime(new Date(entry.ts).getTime())}]
            </span>
            <p className="min-w-0 flex-1" style={BODY_TEXT_STYLE}>
              {renderEventContent(entry, eventT, playerVisuals)}
            </p>
          </div>
        );
      })}
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
              style={getActiveStyle(index === packIndex)}
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
  initialMessages: _initialMessages,
  externalMessages,
  viewerToken,
  onSendMessage,
  onSendSticker,
}: ChatWindowProps) {
  const t = useTranslations('Chat');
  const eventT = useTranslations('EventLog');

  const [activeTab,    setActiveTab]    = useState<ChatWindowTab>(ChatWindowTab.CHAT);
  const [draft,        setDraft]        = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const [packIndex,    setPackIndex]    = useState(0);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const stickerPacks = useStickerPacks();

  const eventEntries = useMemo(
    () => log.filter((e) => e.kind === LogKind.EVENT),
    [log],
  );

  const playerVisuals = useMemo(() => {
    const map = new Map<string, PlayerVisual>();
    for (const entry of log) {
      if (entry.playerName && entry.playerToken) {
        map.set(entry.playerName, { color: TOKEN_COLORS[entry.playerToken] });
      }
    }
    return map;
  }, [log]);

  // Chat history derived from game log — persisted across reloads via game-store localStorage.
  const serverChatEntries = useMemo(() =>
    log
      .filter((e) => e.kind === LogKind.CHAT || e.kind === LogKind.STICKER)
      .map((e): ChatMessage => ({
        id:     e.id,
        kind:   'chat',
        author: e.playerName,
        token:  e.playerToken,
        text:   e.stickerUrl ? `[sticker:${e.stickerUrl}]` : e.text,
        ts:     Date.parse(e.ts),
      })),
    [log],
  );

  // Real-time socket messages not yet confirmed in the server log (no id overlap).
  const realtimeOnly = useMemo(() => {
    const serverIds = new Set(serverChatEntries.map((m) => m.id));
    return (externalMessages ?? []).filter((m) => !serverIds.has(m.id));
  }, [externalMessages, serverChatEntries]);

  // Local optimistic sends not yet confirmed by server or real-time feed.
  const pendingLocal = useMemo(() => {
    const confirmedTexts = new Set(
      [...serverChatEntries, ...realtimeOnly].map((m) => m.text + '|' + Math.floor(m.ts / 30_000)),
    );
    return localMessages.filter(
      (local) => !confirmedTexts.has(local.text + '|' + Math.floor(local.ts / 30_000)),
    );
  }, [localMessages, serverChatEntries, realtimeOnly]);

  const displayMessages = useMemo(
    () => [...serverChatEntries, ...realtimeOnly, ...pendingLocal].sort((a, b) => a.ts - b.ts),
    [serverChatEntries, realtimeOnly, pendingLocal],
  );

  // Unread badge: count new server chat messages while not on the chat tab.
  const prevServerLenRef = useRef(serverChatEntries.length);
  useEffect(() => {
    if (serverChatEntries.length > prevServerLenRef.current && activeTab !== ChatWindowTab.CHAT) {
      setUnreadCount((c) => c + (serverChatEntries.length - prevServerLenRef.current));
    }
    prevServerLenRef.current = serverChatEntries.length;
  }, [serverChatEntries.length, activeTab]);

  useEffect(() => {
    if (activeTab === ChatWindowTab.CHAT) setUnreadCount(0);
  }, [activeTab]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, eventEntries.length, displayMessages.length]);


  function handleSend() {
    const text = clampMessage(draft.trim());
    if (!text) return;
    setLocalMessages((current) => [...current, {
      id: `local-${Date.now()}`, kind: 'chat', author: 'You', token: viewerToken, text, ts: Date.now(),
    }]);
    if (activeTab !== ChatWindowTab.CHAT) setUnreadCount((c) => c + 1);
    setDraft('');
    onSendMessage?.(text);
  }

  function handleSticker(url: string) {
    setLocalMessages((current) => [...current, {
      id: `sticker-${Date.now()}`, kind: 'chat', author: 'You', token: viewerToken,
      text: `[sticker:${url}]`, ts: Date.now(),
    }]);
    if (activeTab !== ChatWindowTab.CHAT) setUnreadCount((c) => c + 1);
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
          {activeTab === ChatWindowTab.EVENTS ? (
            eventEntries.length === 0
              ? <EmptyState label={t('noEventsYet')} />
              : <EventEntries
                  entries={eventEntries}
                  eventT={eventT}
                  playerVisuals={playerVisuals}
                />
          ) : (
            displayMessages.length === 0
              ? <EmptyState label={t('noMessagesYet')} />
              : <MessageEntries
                  entries={displayMessages}
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
