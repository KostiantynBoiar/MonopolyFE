'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_COLORS, type TokenColor } from '@/features/player-panel';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  kind: 'chat' | 'event';
  author?: string;
  token?: TokenColor;
  text: string;
  ts: number;
};

type StickerPack = {
  id: string;
  name: string;
  stickers: string[]; // filenames inside /stickers/{id}/
};

// ─── Sticker manifest ─────────────────────────────────────────────────────────

const EMOJI_SET = ['🎲', '🏠', '🏨', '💰', '💸', '🎩', '🚗', '🐕', '⚓', '🎯', '🤝', '😤', '🤑', '😬', '🏦'];

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 bg-line" />
      <span className="shrink-0 font-sans text-[0.75em] italic text-muted">{text}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function MessageRow({ author, token, text }: { author?: string; token?: TokenColor; text: string }) {
  const color = token ? TOKEN_COLORS[token] : '#10182E';
  const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);

  if (stickerMatch) {
    return (
      <div className="flex items-start gap-1.5">
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <div>
          <span className="block font-sans text-[0.82em] font-semibold leading-snug" style={{ color }}>
            {author}
          </span>
          <TgsPlayer src={stickerMatch[1]} size={72} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1.5">
      <span
        className="mt-1 h-2 w-2 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <p className="min-w-0 font-sans text-[0.82em] leading-snug text-ink">
        <span className="mr-1 font-semibold" style={{ color }}>
          {author}
        </span>
        {text}
      </p>
    </div>
  );
}

function ActionBtn({
  label,
  primary,
  enabled,
  handler,
}: {
  label: string;
  primary?: boolean;
  enabled: boolean;
  handler?: () => void;
}) {
  return (
    <button
      onClick={handler}
      disabled={!enabled}
      className={[
        'w-full rounded border font-display font-semibold uppercase tracking-wide transition-colors',
        'text-[0.62em]',
        primary && enabled
          ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
          : primary && !enabled
            ? 'cursor-not-allowed border-line bg-paper text-muted'
            : enabled
              ? 'border-line-2 bg-surface text-ink hover:bg-paper'
              : 'cursor-not-allowed border-line bg-paper text-muted',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ padding: '0.55em 0.4em' }}
    >
      {label}
    </button>
  );
}

// ─── Picker ───────────────────────────────────────────────────────────────────

type PickerTab = 'emoji' | 'stickers';

function Picker({
  onEmoji,
  onSticker,
}: {
  onEmoji: (e: string) => void;
  onSticker: (url: string) => void;
}) {
  const [tab, setTab] = useState<PickerTab>('emoji');
  const [packIdx, setPackIdx] = useState(0);
  const packs = useStickerPacks();

  return (
    <div
      className="absolute bottom-full right-0 z-10 mb-1 w-56 overflow-hidden rounded border border-line bg-surface shadow-md"
      style={{ fontSize: '1em' }}
    >
      {/* Tabs */}
      <div className="flex border-b border-line">
        {(['emoji', 'stickers'] as PickerTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-1.5 font-mono text-[0.68em] uppercase tracking-wider transition-colors',
              tab === t ? 'border-b-2 border-ink font-bold text-ink' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'emoji' && (
        <div className="grid grid-cols-5 gap-0.5 p-2">
          {EMOJI_SET.map((e) => (
            <button
              key={e}
              onClick={() => onEmoji(e)}
              className="rounded p-1 text-center hover:bg-paper"
              style={{ fontSize: '1.1em' }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {tab === 'stickers' && (
        <div>
          {packs.length === 0 ? (
            <p className="p-4 text-center font-sans text-[0.75em] text-muted">No sticker packs yet.</p>
          ) : (
            <>
              {/* Pack tabs */}
              {packs.length > 1 && (
                <div className="flex gap-1 border-b border-line px-2 py-1">
                  {packs.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setPackIdx(i)}
                      className={[
                        'rounded px-2 py-0.5 font-sans text-[0.7em]',
                        i === packIdx ? 'bg-ink text-white' : 'text-muted hover:text-ink',
                      ].join(' ')}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {/* Sticker grid */}
              <div className="grid grid-cols-4 gap-1 p-2">
                {packs[packIdx]?.stickers.map((file) => {
                  const url = `/stickers/${packs[packIdx].id}/${file}`;
                  return (
                    <button
                      key={file}
                      onClick={() => onSticker(url)}
                      className="flex items-center justify-center rounded p-1 hover:bg-paper"
                    >
                      {file.endsWith('.tgs') ? (
                        <TgsPlayer src={url} size={48} />
                      ) : (
                        <img src={url} alt={file} className="h-12 w-12 object-contain" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type BoardCenterPanelProps = {
  messages: ChatMessage[];
  canRoll?: boolean;
  canBuy?: boolean;
  canBuild?: boolean;
  canTrade?: boolean;
  canEndTurn?: boolean;
  onRoll?: () => void;
  onBuy?: () => void;
  onBuild?: () => void;
  onTrade?: () => void;
  onEndTurn?: () => void;
  onSendMessage?: (text: string) => void;
};

export function BoardCenterPanel({
  messages,
  canRoll = false,
  canBuy = false,
  canBuild = false,
  canTrade = false,
  canEndTurn = false,
  onRoll,
  onBuy,
  onBuild,
  onTrade,
  onEndTurn,
  onSendMessage,
}: BoardCenterPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(text?: string) {
    const t = (text ?? draft).trim();
    if (!t) return;
    onSendMessage?.(t);
    setDraft('');
    setShowPicker(false);
  }

  // Actions grow from the bottom; Roll Dice always anchors at the bottom
  const actions = [
    canBuild   && { key: 'build', label: 'Build House',  enabled: true,     handler: onBuild },
    canBuy     && { key: 'buy',   label: 'Buy Property', enabled: true,     handler: onBuy   },
    canTrade   && { key: 'trade', label: 'Trade',         enabled: true,    handler: onTrade  },
    canEndTurn && { key: 'end',   label: 'End Turn',      enabled: true,    handler: onEndTurn },
                  { key: 'roll',  label: 'Roll Dice',     primary: true, enabled: canRoll, handler: onRoll },
  ].filter(Boolean) as { key: string; label: string; primary?: boolean; enabled: boolean; handler?: () => void }[];

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-gray-100"
      style={{ fontSize: '0.72em' }}
    >
      {/* ── Log + Actions row ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Game log */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-line bg-gray-200 px-3 py-1.5">
            <span className="font-mono text-[0.68em] font-semibold uppercase tracking-widest text-muted">
              Game Log
            </span>
          </div>
          <div
            className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}
          >
            {messages.map((msg) =>
              msg.kind === 'event' ? (
                <EventRow key={msg.id} text={msg.text} />
              ) : (
                <MessageRow key={msg.id} author={msg.author} token={msg.token} text={msg.text} />
              ),
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-[27%] shrink-0 flex-col border-l border-line">
          <div className="shrink-0 border-b border-line bg-gray-200 px-3 py-1.5">
            <span className="font-mono text-[0.68em] font-semibold uppercase tracking-widest text-muted">
              Actions
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-1.5 p-2">
            {actions.map(({ key, ...a }) => (
              <ActionBtn key={key} {...a} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="relative shrink-0 border-t border-line bg-gray-200 px-2 py-2">
        <div className="flex items-center gap-1.5">
          <input
            className="h-8 min-w-0 flex-1 rounded border border-line-2 bg-surface px-3 font-sans text-[0.82em] text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            placeholder="Message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />

          {/* Emoji / sticker picker */}
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line-2 bg-surface text-muted transition-colors hover:border-line hover:text-ink"
            title="Emoji & stickers"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
              <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
              <path d="M7 12.5c.8 1.5 5.2 1.5 6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* Send */}
          <button
            onClick={() => send()}
            disabled={!draft.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-blue bg-blue text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {showPicker && (
          <Picker
            onEmoji={(e) => { setDraft((d) => d + e); setShowPicker(false); }}
            onSticker={(url) => { send(`[sticker:${url}]`); }}
          />
        )}
      </div>
    </div>
  );
}
