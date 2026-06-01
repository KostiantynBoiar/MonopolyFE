'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { TOKEN_COLORS } from '@/features/player-panel';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { SESSION_MIN_PLAYERS_TO_START, STATUS_DOT } from '@/shared/config/constants';
import { MemberRole } from '../lobby.enums';
import type { StickerPack } from '@/features/chat/chat.types';
import type { WaitingCenterPanelProps } from '../lobby.types';

// ─── Sticker manifest ─────────────────────────────────────────────────────────

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
      <span className="shrink-0 font-sans text-[0.88em] italic text-muted">{text}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function MessageRow({ author, token, text }: { author?: string; token?: TokenColor; text: string }) {
  const color = token ? TOKEN_COLORS[token] : '#10182E';
  const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);

  if (stickerMatch) {
    const url = stickerMatch[1];
    const media = url.endsWith('.tgs')
      ? <TgsPlayer src={url} size={72} />
      : <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="font-sans text-[1em] font-semibold leading-snug" style={{ color }}>
            {author}
          </span>
        </div>
        {media}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <p className="min-w-0 font-sans text-[1em] leading-snug text-ink">
        <span className="mr-1 font-semibold" style={{ color }}>{author}</span>
        {text}
      </p>
    </div>
  );
}

// ─── Sticker picker ───────────────────────────────────────────────────────────

function StickerCell({ url, file, index, onSelect }: { url: string; file: string; index: number; onSelect: () => void }) {
  const isTgs = file.endsWith('.tgs');
  const [mounted, setMounted] = useState(!isTgs);
  useEffect(() => {
    if (!isTgs) return;
    const t = setTimeout(() => setMounted(true), index * 25);
    return () => clearTimeout(t);
  }, [isTgs, index]);
  return (
    <button className="flex items-center justify-center rounded p-0.5 hover:bg-line active:scale-95" onClick={onSelect} title={file}>
      {isTgs
        ? (mounted ? <TgsPlayer src={url} size={48} loop={false} /> : <div style={{ width: 48, height: 48 }} />)
        : <img src={url} alt={file} className="h-12 w-12 object-contain" />}
    </button>
  );
}

function StickerPicker({ onSticker }: { onSticker: (url: string) => void }) {
  const [packIdx, setPackIdx] = useState(0);
  const packs = useStickerPacks();
  if (packs.length === 0) return null;
  const pack = packs[packIdx];
  return (
    <div className="flex flex-col">
      {packs.length > 1 && (
        <div className="flex shrink-0 gap-1 border-b border-line px-2 py-1">
          {packs.map((p, i) => (
            <button key={p.id} onClick={() => setPackIdx(i)} className={cn('rounded px-2 py-0.5 font-sans text-[0.7em]', i === packIdx ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-4 gap-0.5 overflow-y-auto p-1.5" style={{ maxHeight: 220, scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}>
        {pack?.stickers.map((file, i) => {
          const url = `/stickers/${pack.id}/${file}`;
          return <StickerCell key={file} url={url} file={file} index={i} onSelect={() => onSticker(url)} />;
        })}
      </div>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ label, primary, enabled, handler }: { label: string; primary?: boolean; enabled: boolean; handler?: () => void }) {
  return (
    <button
      onClick={handler}
      disabled={!enabled}
      className={cn(
        'w-full rounded border font-display font-semibold uppercase tracking-wide transition-colors text-[1em]',
        primary && enabled  ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
        : primary           ? 'cursor-not-allowed border-line bg-paper text-muted'
        : enabled           ? 'border-line-2 bg-surface text-ink hover:bg-paper'
                            : 'cursor-not-allowed border-line bg-paper text-muted',
      )}
      style={{ padding: '0.65em 0.6em' }}
    >
      {label}
    </button>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="rounded border border-line-2 bg-paper px-1.5 py-0.5 font-mono text-[0.78em] text-muted transition-colors hover:border-ink hover:text-ink">
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WaitingCenterPanel({
  session,
  messages,
  onSendMessage,
  onLeave,
  onStart,
  isLeaving = false,
  isStarting = false,
  socketStatus,
}: WaitingCenterPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const t = useTranslations('Lobby');
  const isHost  = session.your_role === MemberRole.HOST;
  const canStart = isHost && session.member_count >= SESSION_MIN_PLAYERS_TO_START;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  function sendText() {
    const t = draft.trim();
    if (!t) return;
    onSendMessage?.(t);
    setDraft('');
  }

  function sendSticker(url: string) {
    onSendMessage?.(`[sticker:${url}]`);
    setShowPicker(false);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-paper" style={{ fontSize: '0.72em' }}>

      {/* ── Log + Controls row ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Chat log */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-line/30 px-3 py-2">
            <span className="font-mono text-[0.82em] font-semibold uppercase tracking-widest text-muted">
              {t('chat')}
            </span>
            {socketStatus && (
              <span className={cn('ml-auto h-2 w-2 rounded-full', STATUS_DOT[socketStatus])} title={socketStatus} />
            )}
          </div>
          <div
            className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}
          >
            {messages.length === 0 && <EventRow text={t('waitingForPlayers')} />}
            {messages.map((msg) =>
              msg.kind === 'event'
                ? <EventRow key={msg.id} text={msg.text} />
                : <MessageRow key={msg.id} author={msg.author} token={msg.token} text={msg.text} />,
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Session controls */}
        <div className="flex w-2/5 shrink-0 flex-col border-l border-line">
          <div className="flex shrink-0 items-center border-b border-line bg-line/30 px-3 py-2">
            <span className="font-mono text-[0.82em] font-semibold uppercase tracking-widest text-muted">
              {t('room')}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2">
            {/* Invite code */}
            <div className="rounded border border-line bg-surface px-2 py-1.5">
              <p className="font-mono text-[0.72em] uppercase tracking-widest text-muted">{t('inviteCode')}</p>
              <div className="mt-0.5 flex items-center justify-between gap-1">
                <span className="font-mono text-[0.95em] font-bold tracking-widest text-ink">{session.invite_code}</span>
                <CopyButton text={session.invite_code} />
              </div>
            </div>
            {/* Player count */}
            <div className="flex items-center justify-between px-0.5">
              <span className="font-mono text-[0.78em] text-muted">{t('players')}</span>
              <span className="font-mono text-[0.85em] font-semibold text-ink">{session.member_count} / {session.max_players}</span>
            </div>
            {/* Action buttons */}
            <div className="flex flex-1 flex-col justify-end gap-1.5">
              {isHost && (
                <ActionBtn
                  label={isStarting ? t('starting') : canStart ? t('startGame') : t('needMore', { min: SESSION_MIN_PLAYERS_TO_START })}
                  primary
                  enabled={canStart && !isStarting}
                  handler={onStart}
                />
              )}
              <ActionBtn label={isLeaving ? t('leaving') : t('leaveRoom')} enabled={!isLeaving} handler={onLeave} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="relative shrink-0 border-t border-line bg-line/30 px-2 py-2">
        <div className="flex items-center gap-1.5">
          <input
            className="h-8 min-w-0 flex-1 rounded border border-line-2 bg-surface px-3 font-sans text-[0.82em] text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            placeholder={t('messagePlaceholder')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendText()}
          />
          {/* Sticker toggle */}
          <button
            onClick={() => setShowPicker((v) => !v)}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors',
              showPicker ? 'border-ink bg-ink text-white' : 'border-line-2 bg-surface text-muted hover:border-line hover:text-ink',
            )}
            title={t('stickers')}
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
            onClick={sendText}
            disabled={!draft.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-blue bg-blue text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {showPicker && (
          <div ref={pickerRef} className="absolute bottom-full right-0 z-10 mb-1 w-56 overflow-hidden rounded border border-line bg-surface shadow-md">
            <StickerPicker onSticker={sendSticker} />
          </div>
        )}
      </div>
    </div>
  );
}
