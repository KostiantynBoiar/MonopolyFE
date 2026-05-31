'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { LogEntry } from '@/shared/protocol/game-state';
import type { DiceRoll } from '@/features/chat/chat.types';
import { LogKind } from '@/shared/protocol/game-state.enums';

interface Props {
  log: LogEntry[];
  diceRoll: DiceRoll | null;
  isRolling: boolean;
  canRoll: boolean;
  canEndTurn: boolean;
  canManage: boolean;
  canTrade: boolean;
  onRoll?: () => void;
  onEndTurn?: () => void;
  onManage?: () => void;
  onTrade?: () => void;
  onSendMessage?: (text: string) => void;
}

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    if (!rolling) { setDisplayed(value); return; }
    const iv = setInterval(() => setDisplayed(Math.ceil(Math.random() * 6)), 80);
    return () => clearInterval(iv);
  }, [rolling, value]);
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-ink bg-surface shadow-sm">
      <span className="font-display text-lg font-bold leading-none text-ink">{displayed}</span>
    </div>
  );
}

function ActionBtn({ label, primary, enabled, onClick }: {
  label: string; primary?: boolean; enabled: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      className={cn(
        'h-10 rounded border px-3 font-display text-sm font-semibold uppercase tracking-wide transition-colors',
        primary && enabled  ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
        : primary           ? 'cursor-not-allowed border-line bg-paper text-muted'
        : enabled           ? 'border-line-2 bg-surface text-ink hover:bg-paper'
                            : 'cursor-not-allowed border-line bg-paper text-muted',
      )}
    >
      {label}
    </button>
  );
}

export function MobileGamePanel({
  log, diceRoll, isRolling, canRoll, canEndTurn, canManage, canTrade,
  onRoll, onEndTurn, onManage, onTrade, onSendMessage,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  function sendText() {
    const t = draft.trim();
    if (!t) return;
    onSendMessage?.(t);
    setDraft('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Dice + action buttons */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-2">
        {(isRolling || diceRoll) && (
          <div className="flex shrink-0 items-center gap-1.5">
            <DiceFace value={isRolling ? 1 : (diceRoll?.die1 ?? 1)} rolling={isRolling} />
            <DiceFace value={isRolling ? 1 : (diceRoll?.die2 ?? 1)} rolling={isRolling} />
          </div>
        )}
        <div className="flex flex-1 flex-wrap gap-1.5">
          {canManage && <ActionBtn label="Manage"   enabled onClick={onManage} />}
          {canTrade  && <ActionBtn label="Trade"    enabled onClick={onTrade} />}
          {canRoll   && <ActionBtn label={isRolling ? 'Rolling…' : 'Roll'} primary enabled={!isRolling} onClick={onRoll} />}
          {canEndTurn && <ActionBtn label="End Turn" primary enabled onClick={onEndTurn} />}
        </div>
      </div>

      {/* Game log */}
      <div className="shrink-0 border-b border-line bg-line/20 px-3 py-1">
        <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-widest text-muted">
          Game Log
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ scrollbarWidth: 'thin' }}
      >
        {log.map((entry) =>
          entry.kind === LogKind.EVENT ? (
            <div key={entry.id} className="flex items-center gap-2 py-0.5">
              <div className="h-px flex-1 bg-line" />
              <span className="shrink-0 font-sans text-xs italic text-muted">
                {entry.playerName ? `${entry.playerName}: ${entry.text}` : entry.text}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
          ) : (
            <div key={entry.id} className="flex items-start gap-1 py-0.5">
              <p className="font-sans text-xs leading-snug text-ink">
                <span className="mr-1 font-semibold text-muted">{entry.playerName}:</span>
                {entry.text}
              </p>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div className="shrink-0 border-t border-line bg-line/20 px-2 py-2">
        <div className="flex items-center gap-1.5">
          <input
            className="h-9 min-w-0 flex-1 rounded border border-line-2 bg-surface px-3 font-sans text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            placeholder="Message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendText()}
          />
          <button
            onClick={sendText}
            disabled={!draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-blue bg-blue text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
