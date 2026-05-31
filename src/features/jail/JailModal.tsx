'use client';

import { useEffect, useState } from 'react';

type DiceRoll = { die1: number; die2: number; isDoubles: boolean };

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    if (!rolling) { setDisplayed(value); return; }
    const iv = setInterval(() => setDisplayed(Math.ceil(Math.random() * 6)), 80);
    return () => clearInterval(iv);
  }, [rolling, value]);
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded border-2 border-ink bg-white shadow-sm">
      <span className="font-display text-[1em] font-bold leading-none text-ink">{displayed}</span>
    </div>
  );
}

export type JailModalProps = {
  attempts:    number;       // failed escape rolls so far (0–2)
  canPayFine:  boolean;
  canUseCard:  boolean;
  canRoll:     boolean;
  diceRoll?:   DiceRoll | null;
  isRolling?:  boolean;
  onPayFine:   () => void;
  onUseCard:   () => void;
  onRoll:      () => void;
};

export function JailModal({
  attempts, canPayFine, canUseCard, canRoll,
  diceRoll = null, isRolling = false,
  onPayFine, onUseCard, onRoll,
}: JailModalProps) {
  const triesLeft = Math.max(0, 3 - attempts);
  const showDice = isRolling || diceRoll !== null;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-white shadow-2xl"
      style={{ width: '12em' }}
    >
      {/* Header */}
      <div className="flex shrink-0 flex-col items-center justify-end bg-ink px-2 pb-1.5 pt-2">
        <span className="mb-0.5 leading-none" style={{ fontSize: '1.1em' }}>🔒</span>
        <span className="font-mono font-bold uppercase tracking-widest text-white/70" style={{ fontSize: '0.55em' }}>
          In Jail
        </span>
        <span className="text-center font-display font-black uppercase leading-tight text-white" style={{ fontSize: '0.78em' }}>
          Get Out
        </span>
      </div>

      {/* Dice result */}
      {showDice && (
        <div className="flex flex-col items-center gap-1 border-b border-ink/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <DiceFace value={isRolling ? 1 : (diceRoll?.die1 ?? 1)} rolling={isRolling} />
            <DiceFace value={isRolling ? 1 : (diceRoll?.die2 ?? 1)} rolling={isRolling} />
          </div>
          {!isRolling && diceRoll && (
            <span className="font-mono text-muted" style={{ fontSize: '0.58em' }}>
              {diceRoll.die1 + diceRoll.die2}{diceRoll.isDoubles ? ' — doubles!' : ' — no doubles'}
            </span>
          )}
        </div>
      )}

      {/* Status */}
      <div className="border-b border-ink/20 px-3 py-1.5 text-center">
        <span className="font-sans text-muted" style={{ fontSize: '0.6em' }}>
          {triesLeft > 0
            ? `${triesLeft} roll${triesLeft === 1 ? '' : 's'} left to escape with doubles`
            : 'Out of rolls — you must pay the fine'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 px-2 py-2">
        <button
          onClick={onRoll}
          disabled={!canRoll}
          className="rounded bg-green py-1 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#186444] active:scale-95 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          style={{ fontSize: '0.6em' }}
        >
          Roll for Doubles
        </button>
        <button
          onClick={onPayFine}
          disabled={!canPayFine}
          className="rounded border border-ink bg-surface py-1 font-display font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper active:scale-95 disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
          style={{ fontSize: '0.6em' }}
        >
          Pay M50 Fine
        </button>
        <button
          onClick={onUseCard}
          disabled={!canUseCard}
          className="rounded border border-ink bg-surface py-1 font-display font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper active:scale-95 disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
          style={{ fontSize: '0.6em' }}
        >
          Use Jail Card
        </button>
      </div>
    </div>
  );
}
