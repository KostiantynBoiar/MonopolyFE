'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { bandColors } from '@/shared/config/constants';
import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { TradeOffer } from '@/shared/protocol/game-state';

export type TradePlayer = { id: string; name: string; balance: number };
export type TradeAsset  = { position: number; name: string; color?: PropertyColor };

export type TradeBuilderProps = {
  me:             TradePlayer;
  others:         TradePlayer[];
  myProperties:   TradeAsset[];
  myJailCards:    number;
  propertiesOf:   (playerId: string) => TradeAsset[];
  jailCardsOf:    (playerId: string) => number;
  onPropose:      (targetId: string, offer: TradeOffer, request: TradeOffer) => void;
  onClose:        () => void;
};

function MoneyInput({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value || ''}
      placeholder="0"
      onChange={(e) => onChange(Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0))))}
      className="h-8 w-24 rounded border border-line-2 bg-surface px-1.5 font-mono text-ink focus:border-blue focus:outline-none"
      style={{ fontSize: '1em' }}
    />
  );
}

function AssetChip({ asset, selected, onToggle }: { asset: TradeAsset; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1 rounded border px-1.5 py-0.5 transition-colors',
        selected ? 'border-ink bg-paper' : 'border-line bg-surface hover:bg-paper',
      )}
      style={{ fontSize: '1em' }}
    >
      {asset.color && <span className={cn('h-3 w-3 rounded-sm', bandColors[asset.color])} />}
      <span className={cn('font-sans text-ink', selected && 'font-semibold')}>{asset.name}</span>
      {selected && <span className="text-green">✓</span>}
    </button>
  );
}

function Stepper({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
  if (max === 0) return null;
  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: '1em' }}>
      <span className="text-muted">{label}</span>
      <button className="rounded border border-line px-1.5 text-ink" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="w-4 text-center font-mono text-ink">{value}</span>
      <button className="rounded border border-line px-1.5 text-ink" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

export function TradeBuilder({
  me, others, myProperties, myJailCards, propertiesOf, jailCardsOf, onPropose, onClose,
}: TradeBuilderProps) {
  const [targetId, setTargetId]   = useState(others[0]?.id ?? '');
  const [giveMoney, setGiveMoney] = useState(0);
  const [getMoney, setGetMoney]   = useState(0);
  const [givePos, setGivePos]     = useState<Set<number>>(new Set());
  const [getPos, setGetPos]       = useState<Set<number>>(new Set());
  const [giveCards, setGiveCards] = useState(0);
  const [getCards, setGetCards]   = useState(0);

  const target = others.find((p) => p.id === targetId);
  const targetProps = target ? propertiesOf(target.id) : [];
  const targetCards = target ? jailCardsOf(target.id) : 0;

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void, pos: number) => {
    const next = new Set(set);
    next.has(pos) ? next.delete(pos) : next.add(pos);
    setter(next);
  };

  const nothingOffered =
    giveMoney === 0 && getMoney === 0 && givePos.size === 0 && getPos.size === 0 && giveCards === 0 && getCards === 0;

  function propose() {
    if (!target || nothingOffered) return;
    const offer: TradeOffer   = { money: giveMoney, positions: [...givePos], getOutOfJailCards: giveCards };
    const request: TradeOffer = { money: getMoney,  positions: [...getPos],  getOutOfJailCards: getCards };
    onPropose(target.id, offer, request);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-ink px-3 py-2">
        <span className="font-display font-black uppercase tracking-wide text-white" style={{ fontSize: '0.8em' }}>
          Propose Trade
        </span>
        <button onClick={onClose} className="font-mono text-white/70 hover:text-white" style={{ fontSize: '0.8em' }} aria-label="Close">✕</button>
      </div>

      {/* Target selector */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <span className="font-sans text-muted" style={{ fontSize: '0.65em' }}>Trade with</span>
        <select
          value={targetId}
          onChange={(e) => { setTargetId(e.target.value); setGetPos(new Set()); setGetCards(0); }}
          className="h-6 flex-1 rounded border border-line-2 bg-surface px-1 font-sans text-ink focus:outline-none"
          style={{ fontSize: '0.7em' }}
        >
          {others.map((p) => <option key={p.id} value={p.id}>{p.name} (M{p.balance})</option>)}
        </select>
      </div>

      <div className="flex min-h-0 flex-1 overflow-y-auto">
        {/* You give */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-r border-line p-2.5">
          <span className="font-mono font-semibold uppercase tracking-widest text-muted" style={{ fontSize: '1em' }}>
            You give
          </span>
          <div className="flex items-center gap-1" style={{ fontSize: '1em' }}>
            <span className="text-muted">M</span>
            <MoneyInput value={giveMoney} max={me.balance} onChange={setGiveMoney} />
          </div>
          <div className="flex flex-wrap gap-1">
            {myProperties.map((a) => (
              <AssetChip key={a.position} asset={a} selected={givePos.has(a.position)} onToggle={() => toggle(givePos, setGivePos, a.position)} />
            ))}
            {myProperties.length === 0 && <span className="italic text-muted" style={{ fontSize: '1em' }}>no properties</span>}
          </div>
          <Stepper label="Jail cards" value={giveCards} max={myJailCards} onChange={setGiveCards} />
        </div>

        {/* You get */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
          <span className="font-mono font-semibold uppercase tracking-widest text-muted" style={{ fontSize: '1em' }}>
            You get
          </span>
          <div className="flex items-center gap-1" style={{ fontSize: '1em' }}>
            <span className="text-muted">M</span>
            <MoneyInput value={getMoney} max={target?.balance ?? 0} onChange={setGetMoney} />
          </div>
          <div className="flex flex-wrap gap-1">
            {targetProps.map((a) => (
              <AssetChip key={a.position} asset={a} selected={getPos.has(a.position)} onToggle={() => toggle(getPos, setGetPos, a.position)} />
            ))}
            {targetProps.length === 0 && <span className="italic text-muted" style={{ fontSize: '1em' }}>no properties</span>}
          </div>
          <Stepper label="Jail cards" value={getCards} max={targetCards} onChange={setGetCards} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-gray-200 px-3 py-2">
        <button
          onClick={onClose}
          className="rounded border border-line-2 bg-surface font-display font-semibold uppercase tracking-wide text-ink hover:bg-paper"
          style={{ fontSize: '0.62em', padding: '0.45em 0.8em' }}
        >
          Cancel
        </button>
        <button
          onClick={propose}
          disabled={!target || nothingOffered}
          className="rounded border border-gold-600 bg-gold font-display font-semibold uppercase tracking-wide text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
          style={{ fontSize: '0.62em', padding: '0.45em 0.8em' }}
        >
          Propose
        </button>
      </div>
    </div>
  );
}
