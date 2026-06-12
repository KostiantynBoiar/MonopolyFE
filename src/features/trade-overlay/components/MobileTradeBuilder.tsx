'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { bandColors } from '@/shared/config/constants';
import { useDialog } from '@/shared/hooks/useDialog';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import { useBoardTileName } from '@/features/game-board/board-tile-name';
import { useTranslations } from 'next-intl';
import type { TradeAsset, TradeBuilderProps, TradeCounterparty } from '../trade-builder.types';
import { clampTradeMoneyInput, isEmptyTradeOffer } from '../trade-builder.utils';

const C = GAME_BOARD_COLORS;
const T = BOARD_TILE_COLORS;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TargetChip({
  player,
  isSelected,
}: {
  player: TradeCounterparty;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-[10px] border px-3 py-2',
        isSelected ? 'border-blue bg-blue/10' : 'border-line bg-surface',
      )}
    >
      <span className="text-sm font-semibold text-ink">{player.name}</span>
      <span className="font-mono text-xs text-muted">M{player.balance}</span>
    </div>
  );
}

function AssetRow({ asset }: { asset: TradeAsset }) {
  const resolveTileName = useBoardTileName();
  return (
    <div className="flex items-center gap-2.5 rounded-[8px] border border-line bg-surface px-3 py-2">
      {asset.color && (
        <span className={cn('h-3.5 w-3.5 shrink-0 rounded-sm', bandColors[asset.color])} />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{resolveTileName(asset.position)}</span>
    </div>
  );
}

function MoneyRow({
  value,
  max,
  label,
  onChange,
}: {
  value: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm font-semibold text-muted">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        value={value || ''}
        placeholder="0"
        onChange={(e) => onChange(clampTradeMoneyInput(e.target.value, max))}
        className="h-10 flex-1 rounded-[8px] border border-line-2 bg-surface px-3 font-mono text-base text-ink focus:border-blue focus:outline-none"
      />
    </div>
  );
}

function CardRow({
  value,
  max,
  label,
  onChange,
}: {
  value: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}) {
  if (max === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-sm text-muted">{label}</span>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-line text-lg text-ink"
        onClick={() => onChange(Math.max(0, value - 1))}
      >−</button>
      <span className="w-6 text-center font-mono text-sm font-bold text-ink">{value}</span>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-line text-lg text-ink"
        onClick={() => onChange(Math.min(max, value + 1))}
      >+</button>
    </div>
  );
}

// ─── Panel (Give / Get) ───────────────────────────────────────────────────────

function Panel({
  moneyValue,
  moneyMax,
  moneyLabel,
  cards,
  cardsMax,
  jailCardsLabel,
  assets,
  emptyLabel,
  helperText,
  clearLabel,
  onMoneyChange,
  onCardsChange,
  onClearAssets,
}: {
  moneyValue: number;
  moneyMax: number;
  moneyLabel: string;
  cards: number;
  cardsMax: number;
  jailCardsLabel: string;
  assets: TradeAsset[];
  emptyLabel: string;
  helperText: string;
  clearLabel: string;
  onMoneyChange: (v: number) => void;
  onCardsChange: (v: number) => void;
  onClearAssets: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <MoneyRow value={moneyValue} max={moneyMax} label={moneyLabel} onChange={onMoneyChange} />
      <CardRow value={cards} max={cardsMax} label={jailCardsLabel} onChange={onCardsChange} />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">{helperText}</span>
          {assets.length > 0 && (
            <button
              type="button"
              onClick={onClearAssets}
              className="font-mono text-xs uppercase text-muted hover:text-ink"
            >
              {clearLabel}
            </button>
          )}
        </div>
        {assets.length === 0 ? (
          <p className="text-sm italic text-muted">{emptyLabel}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {assets.map((a) => <AssetRow key={a.position} asset={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MobileTradeBuilder ───────────────────────────────────────────────────────

export function MobileTradeBuilder({
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
  const [tab, setTab] = useState<'give' | 'get'>('give');
  const dialog = useDialog<HTMLDivElement>({ onClose, label: t('builder.header'), modal: false });

  const nothingOffered = isEmptyTradeOffer({
    giveMoney,
    getMoney,
    giveCards,
    getCards,
    offerAssets,
    requestAssets,
  });

  const tabClass = (active: boolean) => cn(
    'flex-1 py-2.5 text-sm font-black uppercase tracking-[0.12em] transition-colors',
    active ? 'text-ink' : 'text-muted',
  );

  return (
    <div
      {...dialog}
      className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-[12px] border border-line bg-paper focus:outline-none"
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{ backgroundColor: C.ink }}
      >
        <span
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: T.altText }}
        >
          {t('builder.header')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full font-mono"
          style={{ color: 'rgba(255,255,255,0.65)' }}
          aria-label={t('builder.close')}
        >
          ✕
        </button>
      </div>

      {/* Target selection */}
      <div
        className="shrink-0 border-b px-4 py-3"
        style={{ borderColor: C.border, backgroundColor: C.surface }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
          {t('builder.instructions')}
        </p>
        <div className="flex flex-wrap gap-2">
          {others.map((player) => (
            <TargetChip
              key={player.id}
              player={player}
              isSelected={player.id === target?.id}
            />
          ))}
        </div>
        {target && (
          <p className="mt-2 text-xs" style={{ color: C.muted }}>
            {t('builder.selectedTarget', { name: target.name })} · M{target.balance}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div
        className="relative flex shrink-0 border-b"
        style={{ borderColor: C.border, backgroundColor: C.panel }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 h-[2px] w-1/2 transition-transform duration-200"
          style={{
            backgroundColor: T.propertyBlue,
            transform: tab === 'give' ? 'translateX(0%)' : 'translateX(100%)',
          }}
        />
        <button type="button" className={tabClass(tab === 'give')} onClick={() => setTab('give')}>
          {t('builder.youGive')}
        </button>
        <button type="button" className={tabClass(tab === 'get')} onClick={() => setTab('get')}>
          {t('builder.youGet')}
        </button>
      </div>

      {/* Panel content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'give' ? (
          <Panel
            moneyValue={giveMoney}
            moneyMax={me.balance}
            moneyLabel="M"
            cards={giveCards}
            cardsMax={me.getOutOfJailCards ?? 0}
            jailCardsLabel={t('builder.jailCards')}
            assets={offerAssets}
            emptyLabel={t('builder.noProperties')}
            helperText={t('builder.offerInstruction')}
            clearLabel={t('builder.clearProperties')}
            onMoneyChange={onGiveMoneyChange}
            onCardsChange={onGiveCardsChange}
            onClearAssets={onClearOfferAssets}
          />
        ) : (
          <Panel
            moneyValue={getMoney}
            moneyMax={target?.balance ?? 0}
            moneyLabel="M"
            cards={getCards}
            cardsMax={target?.getOutOfJailCards ?? 0}
            jailCardsLabel={t('builder.jailCards')}
            assets={requestAssets}
            emptyLabel={target ? t('builder.noProperties') : t('builder.noTargetSelected')}
            helperText={target ? t('builder.requestInstruction', { name: target.name }) : t('builder.requestNeedsTarget')}
            clearLabel={t('builder.clearProperties')}
            onMoneyChange={onGetMoneyChange}
            onCardsChange={onGetCardsChange}
            onClearAssets={onClearRequestAssets}
          />
        )}
      </div>

      {/* Footer */}
      <div
        className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3"
        style={{ backgroundColor: C.surface }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-[8px] border border-line-2 bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink"
        >
          {t('builder.cancel')}
        </button>
        <button
          type="button"
          onClick={onPropose}
          disabled={!target || nothingOffered}
          className="rounded-[8px] border border-gold-600 bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
        >
          {t('builder.propose')}
        </button>
      </div>
    </div>
  );
}
