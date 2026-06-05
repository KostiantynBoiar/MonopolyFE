'use client';

import { cn } from '@/shared/lib/cn';
import { bandColors } from '@/shared/config/constants';
import { useDialog } from '@/shared/hooks/useDialog';
import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import { useTranslations } from 'next-intl';

export type TradePlayer = { id: string; name: string; balance: number; getOutOfJailCards: number };
export type TradeCounterparty = TradePlayer & { getOutOfJailCards: number; propertyCount: number };
export type TradeAsset = { position: number; name: string; color?: PropertyColor };

export type TradeBuilderProps = {
  me: TradePlayer;
  others: TradeCounterparty[];
  target: TradeCounterparty | null;
  offerAssets: TradeAsset[];
  requestAssets: TradeAsset[];
  giveMoney: number;
  getMoney: number;
  giveCards: number;
  getCards: number;
  onGiveMoneyChange: (value: number) => void;
  onGetMoneyChange: (value: number) => void;
  onGiveCardsChange: (value: number) => void;
  onGetCardsChange: (value: number) => void;
  onClearOfferAssets: () => void;
  onClearRequestAssets: () => void;
  onPropose: () => void;
  onClose: () => void;
};

function clampMoneyInput(value: string, max: number) {
  return Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
}

function MoneyInput({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (nextValue: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value || ''}
      placeholder="0"
      onChange={(event) => onChange(clampMoneyInput(event.target.value, max))}
      className="h-8 w-24 rounded border border-line-2 bg-surface px-1.5 font-mono text-ink focus:border-blue focus:outline-none"
      style={{ fontSize: '1em' }}
    />
  );
}

function AssetChip({ asset }: { asset: TradeAsset }) {
  return (
    <span
      className="flex items-center gap-1 rounded border border-line bg-surface px-1.5 py-0.5"
      style={{ fontSize: '1em' }}
    >
      {asset.color && <span className={cn('h-3 w-3 rounded-sm', bandColors[asset.color])} />}
      <span className="font-sans text-ink">{asset.name}</span>
    </span>
  );
}

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (nextValue: number) => void;
}) {
  if (max === 0) return null;

  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: '1em' }}>
      <span className="text-muted">{label}</span>
      <button type="button" className="rounded border border-line px-1.5 text-ink" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="w-4 text-center font-mono text-ink">{value}</span>
      <button type="button" className="rounded border border-line px-1.5 text-ink" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

function PlayerSummary({
  player,
  isSelected,
}: {
  player: TradeCounterparty;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded border px-2 py-1.5',
        isSelected ? 'border-blue bg-blue/10' : 'border-line bg-surface',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-ink" style={{ fontSize: '0.78em' }}>{player.name}</span>
        <span className="font-mono text-muted" style={{ fontSize: '0.72em' }}>M{player.balance}</span>
      </div>
      <div className="mt-1 flex gap-2 text-muted" style={{ fontSize: '0.68em' }}>
        <span>{player.propertyCount}P</span>
        <span>{player.getOutOfJailCards}J</span>
      </div>
    </div>
  );
}

function SelectionPanel({
  title,
  money,
  moneyMax,
  moneyLabel,
  assets,
  emptyLabel,
  helperText,
  cards,
  cardsMax,
  jailCardsLabel,
  clearLabel,
  onMoneyChange,
  onCardsChange,
  onClearAssets,
}: {
  title: string;
  money: number;
  moneyMax: number;
  moneyLabel: string;
  assets: TradeAsset[];
  emptyLabel: string;
  helperText: string;
  cards: number;
  cardsMax: number;
  jailCardsLabel: string;
  clearLabel: string;
  onMoneyChange: (value: number) => void;
  onCardsChange: (value: number) => void;
  onClearAssets: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
      <span className="font-mono font-semibold uppercase tracking-widest text-muted" style={{ fontSize: '1em' }}>
        {title}
      </span>
      <div className="flex items-center gap-1" style={{ fontSize: '1em' }}>
        <span className="text-muted">{moneyLabel}</span>
        <MoneyInput value={money} max={moneyMax} onChange={onMoneyChange} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-muted" style={{ fontSize: '0.72em' }}>{helperText}</span>
        {assets.length > 0 && (
          <button
            type="button"
            onClick={onClearAssets}
            className="font-mono uppercase text-muted hover:text-ink"
            style={{ fontSize: '0.62em' }}
          >
            {clearLabel}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {assets.map((asset) => <AssetChip key={asset.position} asset={asset} />)}
        {assets.length === 0 && <span className="italic text-muted" style={{ fontSize: '1em' }}>{emptyLabel}</span>}
      </div>
      <Stepper label={jailCardsLabel} value={cards} max={cardsMax} onChange={onCardsChange} />
    </div>
  );
}

export function TradeBuilder({
  me,
  others,
  target,
  offerAssets,
  requestAssets,
  giveMoney,
  getMoney,
  giveCards,
  getCards,
  onGiveMoneyChange,
  onGetMoneyChange,
  onGiveCardsChange,
  onGetCardsChange,
  onClearOfferAssets,
  onClearRequestAssets,
  onPropose,
  onClose,
}: TradeBuilderProps) {
  const t = useTranslations('Trade');
  // Non-modal: the builder needs the player to click their own/the target's tiles on the board.
  const dialog = useDialog<HTMLDivElement>({ onClose, label: t('builder.header'), modal: false });
  const nothingOffered =
    giveMoney === 0 &&
    getMoney === 0 &&
    giveCards === 0 &&
    getCards === 0 &&
    offerAssets.length === 0 &&
    requestAssets.length === 0;

  return (
    <div {...dialog} className="absolute inset-[6px] z-10 flex flex-col overflow-hidden rounded-[12px] border border-line bg-white focus:outline-none">
      <div className="flex shrink-0 items-center justify-between bg-ink px-3 py-2">
        <span className="font-display font-black uppercase tracking-wide text-white" style={{ fontSize: '0.8em' }}>
          {t('builder.header')}
        </span>
        <button type="button" onClick={onClose} className="font-mono text-white/70 hover:text-white" style={{ fontSize: '0.8em' }} aria-label={t('builder.close')}>✕</button>
      </div>

      <div className="border-b border-line px-3 py-2">
        <p className="font-sans text-muted" style={{ fontSize: '0.7em' }}>
          {t('builder.instructions')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {others.map((player) => (
            <PlayerSummary key={player.id} player={player} isSelected={player.id === target?.id} />
          ))}
        </div>
      </div>

      <div className="border-b border-line px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-muted" style={{ fontSize: '0.72em' }}>
            {target ? t('builder.selectedTarget', { name: target.name }) : t('builder.awaitingTarget')}
          </span>
          <span className="font-mono text-muted" style={{ fontSize: '0.68em' }}>
            {target ? `M${target.balance}` : t('builder.chooseFromBoard')}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <SelectionPanel
          title={t('builder.youGive')}
          money={giveMoney}
          moneyMax={me.balance}
          moneyLabel="M"
          assets={offerAssets}
          emptyLabel={t('builder.noProperties')}
          helperText={t('builder.offerInstruction')}
          cards={giveCards}
          cardsMax={me.getOutOfJailCards ?? 0}
          jailCardsLabel={t('builder.jailCards')}
          clearLabel={t('builder.clearProperties')}
          onMoneyChange={onGiveMoneyChange}
          onCardsChange={onGiveCardsChange}
          onClearAssets={onClearOfferAssets}
        />

        <div className="w-px shrink-0 bg-line" />

        <SelectionPanel
          title={t('builder.youGet')}
          money={getMoney}
          moneyMax={target?.balance ?? 0}
          moneyLabel="M"
          assets={requestAssets}
          emptyLabel={target ? t('builder.noProperties') : t('builder.noTargetSelected')}
          helperText={target ? t('builder.requestInstruction', { name: target.name }) : t('builder.requestNeedsTarget')}
          cards={getCards}
          cardsMax={target?.getOutOfJailCards ?? 0}
          jailCardsLabel={t('builder.jailCards')}
          clearLabel={t('builder.clearProperties')}
          onMoneyChange={onGetMoneyChange}
          onCardsChange={onGetCardsChange}
          onClearAssets={onClearRequestAssets}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-gray-200 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line-2 bg-surface font-display font-semibold uppercase tracking-wide text-ink hover:bg-paper"
          style={{ fontSize: '0.62em', padding: '0.45em 0.8em' }}
        >
          {t('builder.cancel')}
        </button>
        <button
          type="button"
          onClick={onPropose}
          disabled={!target || nothingOffered}
          className="rounded border border-gold-600 bg-gold font-display font-semibold uppercase tracking-wide text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
          style={{ fontSize: '0.62em', padding: '0.45em 0.8em' }}
        >
          {t('builder.propose')}
        </button>
      </div>
    </div>
  );
}
