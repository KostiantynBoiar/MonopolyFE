'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { MemberRole } from '@/features/lobby';
import type { ChatMessage } from '@/features/chat/chat.types';
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

interface WaitingCenterGridProps {
  inviteCode: string;
  memberCount: number;
  maxPlayers: number;
  yourRole: MemberRole | null;
  messages: ChatMessage[];
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
    <div className="grid h-full w-full grid-cols-6 grid-rows-5 gap-[6px] p-[6px]">

      {/* Empty top-left 2×2 — placeholder matching DiceWindow slot */}
      <div
        className="col-span-2 row-span-2 min-h-0 rounded-[12px] border"
        style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
      />

      {/* Actions — top-right 4×2 */}
      <section className="col-span-4 col-start-3 row-span-2 grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-[6px]">
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="rounded-[12px] border px-4 font-display text-[22px] font-black uppercase tracking-[0.12em] disabled:cursor-not-allowed"
          style={canStart ? {
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            borderColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
            transition: TRANSITION,
          } : DISABLED_BUTTON}
        >
          {startLabel}
        </button>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[6px]">
          <div
            className="rounded-[10px] border px-3 py-2"
            style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
          >
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: GAME_BOARD_COLORS.muted }}>
              {t('players')}
            </p>
            <p className="font-mono text-[15px] font-bold" style={{ color: GAME_BOARD_COLORS.text }}>
              {memberCount} / {maxPlayers}
            </p>
          </div>
          <button
            type="button"
            onClick={onLeave}
            disabled={isLeaving}
            className="h-full rounded-[10px] border px-3 text-[12px] font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-60"
            style={isLeaving ? DISABLED_BUTTON : {
              backgroundColor: GAME_BOARD_COLORS.surface,
              borderColor: GAME_BOARD_COLORS.border,
              color: GAME_BOARD_COLORS.muted,
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
          className="mt-2 flex min-h-0 flex-1 items-center justify-center rounded-[10px] border px-2 text-center font-mono text-[24px] font-black tracking-[0.14em]"
          title={t('copyInviteCode')}
          aria-label={t('copyInviteCodeWithValue', { code: inviteCode })}
          style={{
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
