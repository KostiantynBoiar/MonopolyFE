'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui';

type GameActionsProps = {
  canRoll?: boolean;
  canBuy?: boolean;
  canBuild?: boolean;
  canEndTurn?: boolean;
  onRoll?: () => void;
  onBuy?: () => void;
  onBuild?: () => void;
  onEndTurn?: () => void;
  onSendMessage?: (text: string) => void;
};

export function GameActions({
  canRoll = true,
  canBuy = false,
  canBuild = false,
  canEndTurn = false,
  onRoll,
  onBuy,
  onBuild,
  onEndTurn,
  onSendMessage,
}: GameActionsProps) {
  const [draft, setDraft] = useState('');

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setDraft('');
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line bg-paper p-3">
      {/* Chat input */}
      <div className="flex gap-2">
        <input
          className="h-8 flex-1 rounded-sm border border-line-2 bg-surface px-2.5 font-sans text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          placeholder="Say something…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button size="sm" variant="ghost" onClick={handleSend} disabled={!draft.trim()}>
          Send
        </Button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="gold"
          size="sm"
          className="col-span-2"
          disabled={!canRoll}
          onClick={onRoll}
        >
          Roll Dice
        </Button>
        <Button variant="blue" size="sm" disabled={!canBuy} onClick={onBuy}>
          Buy Property
        </Button>
        <Button variant="blue" size="sm" disabled={!canBuild} onClick={onBuild}>
          Build House
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2"
          disabled={!canEndTurn}
          onClick={onEndTurn}
        >
          End Turn
        </Button>
      </div>
    </div>
  );
}
