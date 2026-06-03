'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import { TOKEN_COLORS } from '@/shared/config/constants';
import { SESSION_MIN_PLAYERS_TO_START, STATUS_DOT } from '@/shared/config/constants';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { MemberRole } from '../lobby.enums';
import type {
  WaitingActionsPanelProps,
  WaitingCenterPanelProps,
  WaitingChatPanelProps,
  WaitingInviteCodePanelProps,
} from '../lobby.types';

function getStickerUrl(text: string) {
  const match = text.match(/^\[sticker:(.+?)\]$/);
  return match?.[1] ?? null;
}

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
  const t = useTranslations('Lobby');
  const color = token ? TOKEN_COLORS[token] : '#10182E';
  const stickerUrl = getStickerUrl(text);

  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        <p className="font-sans text-[1em] leading-snug text-ink">
          <span className="mr-1 font-semibold" style={{ color }}>{author ?? t('player')}</span>
          {!stickerUrl && text}
        </p>
        {stickerUrl && (
          stickerUrl.endsWith('.tgs')
            ? <TgsPlayer src={stickerUrl} size={72} />
            : <img src={stickerUrl} alt={t('stickerAlt')} className="h-[72px] w-[72px] object-contain" />
        )}
      </div>
    </div>
  );
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function WaitingActionsPanel({
  session,
  onLeave,
  onStart,
  isLeaving = false,
  isStarting = false,
}: WaitingActionsPanelProps) {
  const t = useTranslations('Lobby');
  const isHost = session.your_role === MemberRole.HOST;
  const hasEnoughPlayers = session.member_count >= SESSION_MIN_PLAYERS_TO_START;
  const canStart = isHost && hasEnoughPlayers && !isStarting;

  const startLabel = !isHost
    ? t('waitingForHost')
    : isStarting
      ? t('starting')
      : hasEnoughPlayers
        ? t('startGame')
        : t('needMore', { min: SESSION_MIN_PLAYERS_TO_START });

  return (
    <section className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-[6px]">
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className={cn(
          'flex h-full min-h-0 items-center justify-center rounded-[12px] border px-4 py-4 text-center font-display text-[22px] font-black uppercase tracking-[0.12em] transition-colors',
          canStart
            ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
            : 'cursor-not-allowed border-line bg-surface text-muted',
        )}
      >
        {startLabel}
      </button>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[6px]">
        <div className="rounded-[10px] border border-line bg-surface px-3 py-2 text-left">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t('players')}
          </p>
          <p className="font-mono text-[15px] font-bold text-ink">
            {session.member_count} / {session.max_players}
          </p>
        </div>
        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            disabled={isLeaving}
            className="h-full rounded-[10px] border border-line-2 bg-surface px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLeaving ? t('leaving') : t('leaveRoom')}
          </button>
        )}
      </div>
    </section>
  );
}

export function WaitingInviteCodePanel({ session }: WaitingInviteCodePanelProps) {
  const t = useTranslations('Lobby');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyToClipboard(session.invite_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[12px] border border-line bg-surface p-3 text-left">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {t('inviteCode')}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 flex min-h-0 flex-1 items-center justify-center rounded-[10px] border border-line-2 bg-paper px-2 text-center font-mono text-[24px] font-black tracking-[0.14em] text-ink transition-colors hover:border-ink"
        title={t('copyInviteCode')}
        aria-label={t('copyInviteCodeWithValue', { code: session.invite_code })}
      >
        {session.invite_code}
      </button>
      <p className="mt-2 text-center font-sans text-[12px] font-semibold text-muted" aria-live="polite">
        {copied ? t('copied') : t('clickToCopy')}
      </p>
    </section>
  );
}

export function WaitingChatPanel({ messages, onSendMessage, socketStatus }: WaitingChatPanelProps) {
  const t = useTranslations('Lobby');
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendText() {
    const text = draft.trim().slice(0, 128);
    if (!text) return;
    onSendMessage?.(text);
    setDraft('');
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_40px] overflow-hidden rounded-[12px] border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line bg-line/30 px-3 py-2">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
          {t('chat')}
        </span>
        {socketStatus && (
          <span className={cn('ml-auto h-2 w-2 rounded-full', STATUS_DOT[socketStatus])} title={socketStatus} />
        )}
      </header>

      <div
        className="flex min-h-0 flex-col gap-1 overflow-y-auto p-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}
      >
        {messages.length === 0 && <EventRow text={t('waitingForPlayers')} />}
        {messages.map((message) =>
          message.kind === 'event'
            ? <EventRow key={message.id} text={message.text} />
            : <MessageRow key={message.id} author={message.author} token={message.token} text={message.text} />,
        )}
        <div ref={bottomRef} />
      </div>

      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_40px] gap-[3px] border-t border-line bg-line/30 p-[3px]">
        <input
          className="min-h-0 rounded-[9px] border border-line-2 bg-paper px-3 font-sans text-[13px] text-ink outline-none placeholder:text-muted focus:border-blue"
          placeholder={t('messagePlaceholder')}
          value={draft}
          maxLength={128}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') sendText();
          }}
        />
        <button
          type="button"
          onClick={sendText}
          disabled={!draft.trim()}
          className="rounded-[9px] border border-blue bg-blue text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-muted"
        >
          {t('send')}
        </button>
      </div>
    </section>
  );
}

export function WaitingCenterPanel({
  session,
  messages,
  onSendMessage,
  onLeave,
  onStart,
  isLeaving,
  isStarting,
  socketStatus,
}: WaitingCenterPanelProps) {
  return (
    <div className="grid h-full w-full grid-cols-6 grid-rows-5 gap-[6px]">
      <div className="col-span-4 col-start-3 row-span-2 min-h-0">
        <WaitingActionsPanel
          session={session}
          onLeave={onLeave}
          onStart={onStart}
          isLeaving={isLeaving}
          isStarting={isStarting}
        />
      </div>
      <div className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0">
        <WaitingChatPanel messages={messages} onSendMessage={onSendMessage} socketStatus={socketStatus} />
      </div>
      <div className="col-span-2 col-start-5 row-span-3 row-start-3 min-h-0">
        <WaitingInviteCodePanel session={session} />
      </div>
    </div>
  );
}
