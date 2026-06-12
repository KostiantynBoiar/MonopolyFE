'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChatWindow } from '@/features/chat-widget/components/ChatWindow';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { MemberRole } from '@/shared/protocol/session';
import type { ChatMessage } from '@/features/chat-widget/chat.types';
import { SESSION_MIN_PLAYERS_TO_START } from '@/shared/config/constants';
import { LogKind } from '@/shared/protocol/game-state.enums';
import type { LogEntry } from '@/shared/protocol/game-state';

const DISABLED_BUTTON = {
  backgroundColor: GAME_BOARD_COLORS.surface,
  borderColor: GAME_BOARD_COLORS.border,
  color: GAME_BOARD_COLORS.muted,
};

const TRANSITION = 'background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)';

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

export interface WaitingCenterGridProps {
  inviteCode: string;
  memberCount: number;
  maxPlayers: number;
  yourRole: MemberRole | null;
  messages: ChatMessage[];
  viewerUserId?: string;
  isLeaving?: boolean;
  isStarting?: boolean;
  onLeave: () => void;
  onStart: () => void;
  onSendMessage?: (text: string) => void;
  onSendSticker?: (url: string) => void;
}

export function WaitingCenterGrid({
  inviteCode,
  memberCount,
  maxPlayers,
  yourRole,
  messages,
  viewerUserId,
  isLeaving = false,
  isStarting = false,
  onLeave,
  onStart,
  onSendMessage,
  onSendSticker,
}: WaitingCenterGridProps) {
  const t = useTranslations('Lobby');
  const [copied, setCopied] = useState(false);

  const isHost = yourRole === MemberRole.HOST;
  const hasEnoughPlayers = memberCount >= SESSION_MIN_PLAYERS_TO_START;
  const canStart = isHost && hasEnoughPlayers && !isStarting;

  const startLabel = !isHost
    ? t('waitingForHost')
    : isStarting
      ? t('starting')
      : hasEnoughPlayers
        ? t('startGame')
        : t('needMore', { min: SESSION_MIN_PLAYERS_TO_START });

  async function handleCopy() {
    try {
      await copyToClipboard(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const waitingLog: LogEntry[] = [
    {
      id: 'waiting-room-event',
      kind: LogKind.EVENT,
      text: t('waitingForPlayers'),
      ts: new Date(0).toISOString(),
    },
  ];

  return (
    <div className="grid h-full w-full grid-cols-6 grid-rows-5" style={{ gap: 'clamp(3px,0.5vmin,6px)', padding: 'clamp(3px,0.5vmin,6px)' }}>

      {/* Empty top-left 2×2 — placeholder matching DiceWindow slot */}
      <div
        className="col-span-2 row-span-2 min-h-0 rounded-[12px] border"
        style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
      />

      {/* Actions — top-right 4×2 */}
      <section className="col-span-4 col-start-3 row-span-2 grid min-h-0 grid-rows-[minmax(0,1fr)_auto]" style={{ gap: 'clamp(3px,0.5vmin,6px)' }}>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="rounded-[12px] border font-display font-black uppercase tracking-[0.12em] disabled:cursor-not-allowed"
          style={canStart ? {
            ...DISABLED_BUTTON,
            fontSize: 'clamp(13px,2vmin,22px)',
            paddingLeft: 'clamp(8px,1.2vmin,16px)',
            paddingRight: 'clamp(8px,1.2vmin,16px)',
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            borderColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
            transition: TRANSITION,
          } : {
            ...DISABLED_BUTTON,
            fontSize: 'clamp(13px,2vmin,22px)',
            paddingLeft: 'clamp(8px,1.2vmin,16px)',
            paddingRight: 'clamp(8px,1.2vmin,16px)',
          }}
        >
          {startLabel}
        </button>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center" style={{ gap: 'clamp(3px,0.5vmin,6px)' }}>
          <div
            className="rounded-[10px] border px-3 py-2"
            style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
          >
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: GAME_BOARD_COLORS.muted }}>
              {t('players')}
            </p>
            <p className="font-mono font-bold" style={{ fontSize: 'clamp(11px,1.4vmin,15px)', color: GAME_BOARD_COLORS.text }}>
              {memberCount} / {maxPlayers}
            </p>
          </div>
          <button
            type="button"
            onClick={onLeave}
            disabled={isLeaving}
            className="h-full rounded-[10px] border px-3 text-[12px] font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-60"
            style={isLeaving ? DISABLED_BUTTON : {
              backgroundColor: BOARD_TILE_COLORS.propertyRed,
              borderColor: BOARD_TILE_COLORS.propertyRed,
              color: BOARD_TILE_COLORS.altText,
              transition: TRANSITION,
            }}
          >
            {isLeaving ? t('leaving') : t('leaveRoom')}
          </button>
        </div>
      </section>

      {/* Chat — bottom-left 4×3 */}
      <div className="col-span-4 col-start-1 row-span-3 row-start-3 min-h-0">
        <ChatWindow
          log={waitingLog}
          externalMessages={messages}
          viewerUserId={viewerUserId}
          onSendMessage={onSendMessage}
          onSendSticker={onSendSticker}
        />
      </div>

      {/* Invite code — bottom-right 2×3 */}
      <section
        className="col-span-2 col-start-5 row-span-3 row-start-3 flex min-h-0 flex-col rounded-[12px] border p-3"
        style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: GAME_BOARD_COLORS.muted }}>
          {t('inviteCode')}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 flex min-h-0 flex-1 items-center justify-center rounded-[10px] border px-2 text-center font-mono font-black tracking-[0.14em]"
          title={t('copyInviteCode')}
          aria-label={t('copyInviteCodeWithValue', { code: inviteCode })}
          style={{
            fontSize: 'clamp(14px,2.4vmin,24px)',
            backgroundColor: GAME_BOARD_COLORS.tile ?? GAME_BOARD_COLORS.surface,
            borderColor: GAME_BOARD_COLORS.border,
            color: GAME_BOARD_COLORS.text,
            transition: TRANSITION,
          }}
        >
          {inviteCode}
        </button>
        <p className="mt-2 text-center font-sans text-[12px] font-semibold" aria-live="polite" style={{ color: GAME_BOARD_COLORS.muted }}>
          {copied ? t('copied') : t('clickToCopy')}
        </p>
      </section>
    </div>
  );
}
