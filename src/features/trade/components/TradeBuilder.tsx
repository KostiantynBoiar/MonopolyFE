'use client';

import { cn } from '@/shared/lib/cn';
import { bandColors } from '@/shared/config/constants';
import { useDialog } from '@/shared/hooks/useDialog';
import type { PropertyColor } from '@/shared/protocol/game-state.enums';
import { useTranslations } from 'next-intl';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import { useBoardTileName } from '@/features/game-board';

export type TradePlayer = { id: string; name: string; balance: number; getOutOfJailCards: number };
export type TradeCounterparty = TradePlayer & { getOutOfJailCards: number; propertyCount: number };
export type TradeAsset = { position: number; color?: PropertyColor };

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
      className="h-8 w-24 rounded border px-1.5 font-mono focus:outline-none"
      style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border, color: GAME_BOARD_COLORS.text, fontSize: '1em' }}
    />
  );
}

function AssetChip({ asset }: { asset: TradeAsset }) {
  const resolveTileName = useBoardTileName();
  return (
    <span
      className="flex items-center gap-1 rounded border px-1.5 py-0.5"
      style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border, fontSize: '1em' }}
    >
      {asset.color && <span className={cn('h-3 w-3 rounded-sm', bandColors[asset.color])} />}
      <span className="font-sans" style={{ color: GAME_BOARD_COLORS.text }}>{resolveTileName(asset.position)}</span>
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
      <span style={{ color: GAME_BOARD_COLORS.muted }}>{label}</span>
      <button type="button" className="rounded border px-1.5" style={{ borderColor: GAME_BOARD_COLORS.border, color: GAME_BOARD_COLORS.text }} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="w-4 text-center font-mono" style={{ color: GAME_BOARD_COLORS.text }}>{value}</span>
      <button type="button" className="rounded border px-1.5" style={{ borderColor: GAME_BOARD_COLORS.border, color: GAME_BOARD_COLORS.text }} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
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
      className="rounded border px-2 py-1.5"
      style={isSelected
        ? { borderColor: 'var(--board-tile-border)', backgroundColor: `${GAME_BOARD_COLORS.panel}`, outline: `2px solid ${BOARD_TILE_COLORS.propertyBlue}`, outlineOffset: '-1px' }
        : { borderColor: GAME_BOARD_COLORS.border, backgroundColor: GAME_BOARD_COLORS.surface }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold" style={{ fontSize: '0.78em', color: GAME_BOARD_COLORS.text }}>{player.name}</span>
        <span className="font-mono" style={{ fontSize: '0.72em', color: GAME_BOARD_COLORS.muted }}>M{player.balance}</span>
      </div>
      <div className="mt-1 flex gap-2" style={{ fontSize: '0.68em', color: GAME_BOARD_COLORS.muted }}>
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
      <span className="font-mono font-semibold uppercase tracking-widest" style={{ fontSize: '1em', color: GAME_BOARD_COLORS.muted }}>
        {title}
      </span>
      <div className="flex items-center gap-1" style={{ fontSize: '1em' }}>
        <span style={{ color: GAME_BOARD_COLORS.muted }}>{moneyLabel}</span>
        <MoneyInput value={money} max={moneyMax} onChange={onMoneyChange} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans" style={{ fontSize: '0.72em', color: GAME_BOARD_COLORS.muted }}>{helperText}</span>
        {assets.length > 0 && (
          <button
            type="button"
            onClick={onClearAssets}
            className="font-mono uppercase"
            style={{ fontSize: '0.62em', color: GAME_BOARD_COLORS.muted }}
          >
            {clearLabel}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {assets.map((asset) => <AssetChip key={asset.position} asset={asset} />)}
        {assets.length === 0 && <span className="italic" style={{ fontSize: '1em', color: GAME_BOARD_COLORS.muted }}>{emptyLabel}</span>}
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
    <div
      {...dialog}
      className="absolute inset-[6px] z-10 flex flex-col overflow-hidden rounded-[12px] border focus:outline-none"
      style={{ backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border }}
    >
      {/* Accent strip — yellow = propose */}
      <div style={{ height: '4px', backgroundColor: BOARD_TILE_COLORS.propertyYellow, flexShrink: 0 }} />

      <div
        className="flex shrink-0 items-center justify-between px-3 py-2"
        style={{ backgroundColor: GAME_BOARD_COLORS.panel, borderBottom: `1px solid ${GAME_BOARD_COLORS.border}` }}
      >
        <span className="font-display font-black uppercase tracking-wide" style={{ fontSize: '0.8em', color: GAME_BOARD_COLORS.text }}>
          {t('builder.header')}
        </span>
        <button type="button" onClick={onClose} className="font-mono opacity-60 hover:opacity-100" style={{ fontSize: '0.8em', color: GAME_BOARD_COLORS.text }} aria-label={t('builder.close')}>✕</button>
      </div>

      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${GAME_BOARD_COLORS.border}` }}>
        <p className="font-sans" style={{ fontSize: '0.7em', color: GAME_BOARD_COLORS.muted }}>
          {t('builder.instructions')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {others.map((player) => (
            <PlayerSummary key={player.id} player={player} isSelected={player.id === target?.id} />
          ))}
        </div>
      </div>

      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${GAME_BOARD_COLORS.border}` }}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans" style={{ fontSize: '0.72em', color: GAME_BOARD_COLORS.muted }}>
            {target ? t('builder.selectedTarget', { name: target.name }) : t('builder.awaitingTarget')}
          </span>
          <span className="font-mono" style={{ fontSize: '0.68em', color: GAME_BOARD_COLORS.muted }}>
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

        <div className="w-px shrink-0" style={{ backgroundColor: GAME_BOARD_COLORS.border }} />

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

      <div
        className="flex shrink-0 items-center justify-end gap-2 px-3 py-2"
        style={{ borderTop: `1px solid ${GAME_BOARD_COLORS.border}`, backgroundColor: GAME_BOARD_COLORS.panel }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded border font-display font-semibold uppercase tracking-wide transition-opacity hover:opacity-70"
          style={{ fontSize: '0.62em', padding: '0.45em 0.8em', backgroundColor: GAME_BOARD_COLORS.surface, borderColor: GAME_BOARD_COLORS.border, color: GAME_BOARD_COLORS.text }}
        >
          {t('builder.cancel')}
        </button>
        <button
          type="button"
          onClick={onPropose}
          disabled={!target || nothingOffered}
          className="rounded border font-display font-semibold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontSize: '0.62em', padding: '0.45em 0.8em', backgroundColor: BOARD_TILE_COLORS.propertyYellow, borderColor: BOARD_TILE_COLORS.propertyYellow, color: BOARD_TILE_COLORS.altText }}
        >
          {t('builder.propose')}
        </button>
      </div>
    </div>
  );
}
