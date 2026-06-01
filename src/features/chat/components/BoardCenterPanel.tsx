'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_COLORS } from '@/features/player-panel';
import { TokenColor } from '@/shared/protocol/game-state.enums';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import { cn } from '@/shared/lib/cn';
import { CardFlipOverlay } from '@/features/card';
import { TradeWindow, TradeBuilder } from '@/features/trade';
import { DeedCard } from '@/features/deed';
import { JailModal } from '@/features/jail';
import { DebtModal } from '@/features/bankruptcy';
import { AuctionPanel } from '@/features/auction';
import { ManagePropertiesModal } from '@/features/manage';
import { useTranslations } from 'next-intl';
import { StickerPack, BoardCenterPanelProps, Action } from '../chat.types';
import { ActionKey } from '../chat.enums';
import { LogKind } from '@/shared/protocol/game-state.enums';

// ─── Sticker manifest ─────────────────────────────────────────────────────────

function useStickerPacks() {
  const [packs, setPacks] = useState<StickerPack[]>([]);

  useEffect(() => {
    fetch('/stickers/manifest.json')
      .then((r) => r.json())
      .then((data) => setPacks(data.packs ?? []))
      .catch(() => {});
  }, []);

  return packs;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventRow({ text, playerName }: { text: string; playerName?: string }) {
  const displayText = playerName ? `${playerName}: ${text}` : text;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 bg-line" />
      <span className="shrink-0 font-sans text-[0.88em] italic text-muted">{displayText}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function MessageRow({ author, token, text }: { author?: string; token?: TokenColor; text: string }) {
  const color = (token ? TOKEN_COLORS[token as TokenColor] : undefined) ?? '#10182E';
  const stickerMatch = text.match(/^\[sticker:(.+?)\]$/);

  if (stickerMatch) {
    const url = stickerMatch[1];
    const media = url.endsWith('.tgs')
      ? <TgsPlayer src={url} size={72} />
      : <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="font-sans text-[1em] font-semibold leading-snug" style={{ color }}>
            {author}
          </span>
        </div>
        {media}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <p className="min-w-0 font-sans text-[1em] leading-snug text-ink">
        <span className="mr-1 font-semibold" style={{ color }}>{author}</span>
        {text}
      </p>
    </div>
  );
}

function ActionBtn({
  label,
  primary,
  enabled,
  handler,
}: {
  label: string;
  primary?: boolean;
  enabled: boolean;
  handler?: () => void;
}) {
  return (
    <button
      onClick={handler}
      disabled={!enabled}
      className={cn(
        'w-full rounded border font-display font-semibold uppercase tracking-wide transition-colors',
        'text-[1em]',
        primary && enabled  ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
        : primary           ? 'cursor-not-allowed border-line bg-paper text-muted'
        : enabled           ? 'border-line-2 bg-surface text-ink hover:bg-paper'
                            : 'cursor-not-allowed border-line bg-paper text-muted',
      )}
      style={{ padding: '0.65em 0.6em' }}
    >
      {label}
    </button>
  );
}

// ─── Dice face ────────────────────────────────────────────────────────────────

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (!rolling) { setDisplayed(value); return; }
    const iv = setInterval(() => setDisplayed(Math.ceil(Math.random() * 6)), 80);
    return () => clearInterval(iv);
  }, [rolling, value]);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-white shadow-sm">
      <span className="font-display text-[1.1em] font-bold leading-none text-ink">{displayed}</span>
    </div>
  );
}

// ─── Sticker picker ───────────────────────────────────────────────────────────

function StickerCell({
  url,
  file,
  index,
  onSelect,
}: {
  url: string;
  file: string;
  index: number;
  onSelect: () => void;
}) {
  const isTgs = file.endsWith('.tgs');
  const [mounted, setMounted] = useState(!isTgs);

  useEffect(() => {
    if (!isTgs) return;
    const t = setTimeout(() => setMounted(true), index * 25);
    return () => clearTimeout(t);
  }, [isTgs, index]);

  return (
    <button
      className="flex items-center justify-center rounded p-0.5 hover:bg-line active:scale-95"
      onClick={onSelect}
      title={file}
    >
      {isTgs ? (
        mounted
          ? <TgsPlayer src={url} size={48} loop={false} />
          : <div style={{ width: 48, height: 48 }} />
      ) : (
        <img src={url} alt={file} className="h-12 w-12 object-contain" />
      )}
    </button>
  );
}

function StickerPicker({ onSticker }: { onSticker: (url: string) => void }) {
  const [packIdx, setPackIdx] = useState(0);
  const packs = useStickerPacks();

  if (packs.length === 0) {
    return (
      <p className="p-4 text-center font-sans text-[0.75em] text-muted">No sticker packs yet.</p>
    );
  }

  const pack = packs[packIdx];

  return (
    <div className="flex flex-col">
      {packs.length > 1 && (
        <div className="flex shrink-0 gap-1 border-b border-line px-2 py-1">
          {packs.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPackIdx(i)}
              className={cn(
                'rounded px-2 py-0.5 font-sans text-[0.7em]',
                i === packIdx ? 'bg-ink text-white' : 'text-muted hover:text-ink',
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div
        className="grid grid-cols-4 gap-0.5 overflow-y-auto p-1.5"
        style={{ maxHeight: 220, scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}
      >
        {pack?.stickers.map((file, i) => {
          const url = `/stickers/${pack.id}/${file}`;
          return (
            <StickerCell key={file} url={url} file={file} index={i} onSelect={() => onSticker(url)} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BoardCenterPanel({
  log,
  diceRoll = null,
  isRolling = false,
  canRoll = false,
  canBuy = false,
  canManage = false,
  canTrade = false,
  canEndTurn = false,
  onRoll,
  onBuy,
  onManage,
  onTrade,
  onEndTurn,
  onSendMessage,
  activeCard = null,
  onCardProceed,
  activeDeed = null,
  canBuyDeed = true,
  canManageDeed = false,
  onAuction,
  onManageDeed,
  jailDecision = false,
  jailAttempts = 0,
  canPayJailFine = false,
  canUseJailCard = false,
  canRollInJail = false,
  jailDiceRoll = null,
  jailIsRolling = false,
  onPayJailFine,
  onUseJailCard,
  onRollInJail,
  debtPending = false,
  debtAmount = 0,
  canPayDebt = false,
  onPayDebt,
  onManageDebt,
  onDeclareBankruptcy,
  auctionState = null,
  auctionPropertyName = '',
  auctionPlayers = [],
  canBid = false,
  onBid,
  tradeState = null,
  tradeProposer,
  tradeTarget,
  viewerId,
  onTradeAccept,
  onTradeReject,
  onTradeCounter,
  onTradeCancel,
  manageOpen = false,
  manageProperties = [],
  canBuildHouse = false,
  canBuildHotel = false,
  canMortgage = false,
  canUnmortgage = false,
  onBuildHouse,
  onBuildHotel,
  onSellHouse,
  onSellHotel,
  onMortgage,
  onUnmortgage,
  onCloseManage,
  tradeBuilderOpen = false,
  tradeMe,
  tradeOthers = [],
  tradeMyProperties = [],
  tradeMyJailCards = 0,
  tradePropertiesOf,
  tradeJailCardsOf,
  onTradePropose,
  onCloseTradeBuilder,
  compact = false,
}: BoardCenterPanelProps & { compact?: boolean }) {
  // Hooks must come before any early return (React rules of hooks).
  const t = useTranslations('Game');
  const bottomRef  = useRef<HTMLDivElement>(null);
  const pickerRef  = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const isAuctionActive = auctionState !== null;
  const isTradeActive = tradeState !== null
    && (tradeState.status === 'pending' || tradeState.status === 'countered')
    && tradeProposer != null
    && tradeTarget != null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    if (!showPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  // On mobile the center panel is hidden — all actions/overlays are rendered
  // at full viewport size outside the scaled board transform.
  if (compact) {
    return <div className="h-full w-full" />;
  }

  function sendText() {
    const t = draft.trim();
    if (!t) return;
    onSendMessage?.(t);
    setDraft('');
  }

  function sendSticker(url: string) {
    onSendMessage?.(`[sticker:${url}]`);
    setShowPicker(false);
  }

  const actions: Action[] = [
    canManage && { key: ActionKey.MANAGE, label: t('manage'),       enabled: true, handler: onManage },
    canBuy    && { key: ActionKey.BUY,    label: t('buyProperty'),  enabled: true, handler: onBuy },
    canTrade  && { key: ActionKey.TRADE,  label: t('trade'),        enabled: true, handler: onTrade },
    canRoll && {
      key: ActionKey.ROLL,
      label: isRolling ? t('rolling') : t('rollDice'),
      primary: true,
      enabled: canRoll && !isRolling,
      handler: onRoll,
    },
    canEndTurn && {
      key: ActionKey.END_TURN,
      label: t('endTurn'),
      primary: true,
      enabled: true,
      handler: onEndTurn,
    },
  ].filter(Boolean) as Action[];

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-paper"
      style={{ fontSize: '0.72em' }}
    >
      {/* ── Auction panel (swaps whole area when auction is active) ── */}
      {isAuctionActive ? (
        <AuctionPanel
          auctionState={auctionState!}
          propertyName={auctionPropertyName}
          viewerId={viewerId ?? ''}
          players={auctionPlayers}
          canBid={canBid}
          onBid={onBid ?? (() => {})}
        />
      ) : isTradeActive ? (
        <TradeWindow
          trade={tradeState!}
          proposer={tradeProposer!}
          target={tradeTarget!}
          viewerId={viewerId ?? ''}
          onAccept={onTradeAccept}
          onReject={onTradeReject}
          onCounter={onTradeCounter}
          onCancel={onTradeCancel}
        />
      ) : (
        <>
          {/* ── Log + Actions row ── */}
          <div
            className={cn(
              'flex min-h-0 flex-1 overflow-hidden transition-opacity duration-300',
              activeCard || activeDeed || jailDecision || debtPending ? 'opacity-[0.12] pointer-events-none' : 'opacity-100',
            )}
          >
            {/* Game log */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center border-b border-line bg-line/30 px-3 py-2">
                <span className="font-mono text-[0.82em] font-semibold uppercase tracking-widest text-muted">
                  {t('gameLog')}
                </span>
              </div>
              <div
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}
              >
                {log.map((entry) =>
                  entry.kind === LogKind.EVENT ? (
                    <EventRow key={entry.id} playerName={entry.playerName} text={entry.text} />
                  ) : (
                    <MessageRow
                      key={entry.id}
                      author={entry.playerName}
                      token={entry.playerToken}
                      text={entry.text}
                    />
                  ),
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-2/5 shrink-0 flex-col border-l border-line">
              <div className="flex shrink-0 items-center border-b border-line bg-line/30 px-3 py-2">
                <span className="font-mono text-[0.82em] font-semibold uppercase tracking-widest text-muted">
                  {t('gameLog')}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-1.5 p-2">
                {(isRolling || diceRoll) && (
                  <div className="flex flex-col items-center gap-1 pb-1">
                    <div className="flex items-center gap-2">
                      <DiceFace value={isRolling ? 1 : (diceRoll?.die1 ?? 1)} rolling={isRolling} />
                      <DiceFace value={isRolling ? 1 : (diceRoll?.die2 ?? 1)} rolling={isRolling} />
                    </div>
                    {!isRolling && diceRoll && (
                      <span className="font-mono text-[0.62em] text-muted">
                        {diceRoll.die1 + diceRoll.die2}{diceRoll.isDoubles ? ' doubles!' : ''}
                      </span>
                    )}
                  </div>
                )}
                {actions.map(({ key, ...a }) => (
                  <ActionBtn key={key} {...a} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Input bar ── */}
          <div
            className={cn(
              'relative shrink-0 border-t border-line bg-line/30 px-2 py-2 transition-opacity duration-300',
              activeCard || activeDeed || jailDecision || debtPending ? 'opacity-[0.12] pointer-events-none' : 'opacity-100',
            )}
          >
            <div className="flex items-center gap-1.5">
              <input
                className="h-8 min-w-0 flex-1 rounded border border-line-2 bg-surface px-3 font-sans text-[0.82em] text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
                placeholder={t('messagePlaceholder')}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendText()}
              />
              <button
                onClick={() => setShowPicker((v) => !v)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors',
                  showPicker
                    ? 'border-ink bg-ink text-white'
                    : 'border-line-2 bg-surface text-muted hover:border-line hover:text-ink',
                )}
                title={t('messagePlaceholder')}
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
                  <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
                  <path d="M7 12.5c.8 1.5 5.2 1.5 6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={sendText}
                disabled={!draft.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-blue bg-blue text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {showPicker && (
              <div ref={pickerRef} className="absolute bottom-full right-0 z-10 mb-1 w-56 overflow-hidden rounded border border-line bg-surface shadow-md">
                <StickerPicker onSticker={sendSticker} />
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Card flip overlay ── highest priority overlay; always on top ── */}
      {activeCard && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <CardFlipOverlay card={activeCard} onProceed={onCardProceed ?? (() => {})} />
        </div>
      )}

      {/* ── Deed card overlay (unowned purchasable property) ── */}
      {activeDeed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div style={{ fontSize: '3em' }}>
          <DeedCard
            deed={activeDeed}
            canBuy={canBuyDeed}
            canManage={canManageDeed}
            onBuy={onBuy ?? (() => {})}
            onAuction={onAuction ?? (() => {})}
            onManage={onManageDeed ?? (() => {})}
          />
          </div>
        </div>
      )}

      {/* ── Jail decision overlay — hidden while a card awaits consent ── */}
      {jailDecision && !activeCard && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <JailModal
            attempts={jailAttempts}
            canPayFine={canPayJailFine}
            canUseCard={canUseJailCard}
            canRoll={canRollInJail}
            diceRoll={jailDiceRoll}
            isRolling={jailIsRolling}
            onPayFine={onPayJailFine ?? (() => {})}
            onUseCard={onUseJailCard ?? (() => {})}
            onRoll={onRollInJail ?? (() => {})}
          />
        </div>
      )}

      {/* ── Debt overlay ── */}
      {debtPending && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <DebtModal
            amount={debtAmount}
            canPay={canPayDebt}
            onPay={onPayDebt ?? (() => {})}
            onManage={onManageDebt ?? (() => {})}
            onBankrupt={onDeclareBankruptcy ?? (() => {})}
          />
        </div>
      )}

      {/* ── Manage properties overlay ── */}
      {manageOpen && (
        <div className="absolute inset-0 z-40">
          <ManagePropertiesModal
            properties={manageProperties}
            canBuildHouse={canBuildHouse}
            canBuildHotel={canBuildHotel}
            canMortgage={canMortgage}
            canUnmortgage={canUnmortgage}
            onBuildHouse={onBuildHouse ?? (() => {})}
            onBuildHotel={onBuildHotel ?? (() => {})}
            onSellHouse={onSellHouse ?? (() => {})}
            onSellHotel={onSellHotel ?? (() => {})}
            onMortgage={onMortgage ?? (() => {})}
            onUnmortgage={onUnmortgage ?? (() => {})}
            onSellProperty={undefined}
            onClose={onCloseManage ?? (() => {})}
          />
        </div>
      )}

      {/* ── Trade builder overlay ── */}
      {tradeBuilderOpen && tradeMe && tradeOthers.length > 0 && (
        <div className="absolute inset-0 z-40" style={{ fontSize: '1.25em' }}>
          <TradeBuilder
            me={tradeMe}
            others={tradeOthers}
            myProperties={tradeMyProperties}
            myJailCards={tradeMyJailCards}
            propertiesOf={tradePropertiesOf ?? (() => [])}
            jailCardsOf={tradeJailCardsOf ?? (() => 0)}
            onPropose={onTradePropose ?? (() => {})}
            onClose={onCloseTradeBuilder ?? (() => {})}
          />
        </div>
      )}
    </div>
  );
}
