'use client';

import { useTranslations } from 'next-intl';
import { TOKEN_COLORS } from '@/features/player-panel';
import { cn } from '@/shared/lib/cn';
import { TradeParty } from '../trade.enums';
import type { TradeWindowProps } from '../trade.types';
import type { TradeOffer } from '@/shared/protocol/game-state.schema';
import { DeedCard } from '@/features/deed';
import { getDeedInfo } from '@/features/deed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function JailFreeCard({ count }: { count: number }) {
  const t = useTranslations('Trade');
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1">
      <span className="text-[0.85em]">🎴</span>
      <span className="font-sans text-[0.75em] text-ink">{count}× {t('jailFree')}</span>
    </div>
  );
}

function NothingLabel() {
  const t = useTranslations('Trade');
  return <span className="font-sans text-[0.75em] italic text-muted">{t('nothing')}</span>;
}

function resolveViewerRole(viewerId: string, proposerId: string, targetId: string): TradeParty {
  if (viewerId === proposerId) return TradeParty.PROPOSER;
  if (viewerId === targetId)   return TradeParty.TARGET;
  return TradeParty.OBSERVER;
}

function formatMoney(amount: number): string {
  return `M ${amount.toLocaleString()}`;
}

// ─── One side of the offer ────────────────────────────────────────────────────

function OfferSide({
  name,
  token,
  balance,
  offer,
  label,
  dimmed,
}: {
  name: string;
  token: string;
  balance: number;
  offer: TradeOffer;
  label: string;
  dimmed?: boolean;
}) {
  const tokenHex = TOKEN_COLORS[token as keyof typeof TOKEN_COLORS] ?? '#888';
  const isEmpty = offer.money === 0 && offer.positions.length === 0 && offer.getOutOfJailCards === 0;
  const deeds = offer.positions.map((pos) => getDeedInfo(pos)).filter(Boolean);

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-3 p-4', dimmed && 'opacity-50')}>
      {/* Player header */}
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: tokenHex }} />
        <span className="min-w-0 truncate font-display text-[0.88em] font-bold text-ink">{name}</span>
        <span className="ml-auto shrink-0 font-mono text-[0.7em] text-muted">{formatMoney(balance)}</span>
      </div>

      {/* Offer label */}
      <span className="font-mono text-[0.65em] font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>

      {/* Money + jail cards */}
      <div className="flex flex-wrap gap-2">
        {offer.money > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1">
            <span className="text-[0.85em]">💰</span>
            <span className="font-mono text-[0.78em] font-semibold text-ink">{formatMoney(offer.money)}</span>
          </div>
        )}
        {offer.getOutOfJailCards > 0 && (
          <JailFreeCard count={offer.getOutOfJailCards} />
        )}
      </div>

      {/* Deed cards */}
      {deeds.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ fontSize: '0.72em' }}>
          {deeds.map((deed) => (
            <div key={deed!.position} className="shrink-0">
              <DeedCard
                deed={deed!}
                canBuy={false}
                canManage={false}
                onBuy={() => {}}
                onAuction={() => {}}
                onManage={() => {}}
                viewOnly
              />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <NothingLabel />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TradeWindow({
  trade,
  proposer,
  target,
  viewerId,
  onAccept,
  onReject,
  onCounter,
  onCancel,
}: TradeWindowProps) {
  const t = useTranslations('Trade');
  const viewerRole = resolveViewerRole(viewerId, trade.proposerId, trade.targetId);

  const proposerLabel =
    viewerRole === TradeParty.PROPOSER ? t('youGive')
    : viewerRole === TradeParty.TARGET  ? t('offers', { name: proposer.name })
    : t('gives', { name: proposer.name });

  const targetLabel =
    viewerRole === TradeParty.TARGET    ? t('youGiveBack')
    : viewerRole === TradeParty.PROPOSER ? t('givesBack', { name: target.name })
    : t('gives', { name: target.name });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-paper">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b-2 border-ink/20 bg-ink px-4 py-2.5">
        <span className="font-mono text-[0.72em] font-bold uppercase tracking-widest text-white/70">
          {t('header')}
        </span>
        <span className="ml-auto font-sans text-[0.68em] italic text-white/50">
          {viewerRole === TradeParty.TARGET
            ? t('sentOffer', { name: proposer.name })
            : viewerRole === TradeParty.PROPOSER
            ? t('waitingFor', { name: target.name })
            : t('exchange', { proposer: proposer.name, target: target.name })}
        </span>
      </div>

      {/* Exchange area */}
      <div className="flex min-h-0 flex-1 overflow-hidden divide-x-2 divide-ink/10">
        <OfferSide
          name={proposer.name}
          token={proposer.token}
          balance={proposer.balance}
          offer={trade.proposerOffer}
          label={proposerLabel}
          dimmed={viewerRole === TradeParty.TARGET}
        />

        <OfferSide
          name={target.name}
          token={target.token}
          balance={target.balance}
          offer={trade.targetRequest}
          label={targetLabel}
          dimmed={viewerRole === TradeParty.PROPOSER}
        />
      </div>

      {/* Action bar */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t-2 border-ink/20 bg-line/30 px-4 py-2.5">
        {viewerRole === TradeParty.TARGET && (
          <>
            <button
              onClick={onReject}
              className="rounded border border-line-2 bg-surface font-display text-[0.65em] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
              style={{ padding: '0.55em 1em' }}
            >
              {t('reject')}
            </button>
            {onCounter && (
              <button
                onClick={onCounter}
                className="rounded border border-line-2 bg-surface font-display text-[0.65em] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
                style={{ padding: '0.55em 1em' }}
              >
                {t('counter')}
              </button>
            )}
            <button
              onClick={onAccept}
              className="rounded border border-gold-600 bg-gold font-display text-[0.65em] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-600"
              style={{ padding: '0.55em 1em' }}
            >
              {t('accept')}
            </button>
          </>
        )}
        {viewerRole === TradeParty.PROPOSER && (
          <button
            onClick={onCancel}
            className="rounded border border-line-2 bg-surface font-display text-[0.65em] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
            style={{ padding: '0.55em 1em' }}
          >
            {t('withdraw')}
          </button>
        )}
        {viewerRole === TradeParty.OBSERVER && (
          <span className="font-sans text-[0.68em] italic text-muted">
            {t('spectating')}
          </span>
        )}
      </div>
    </div>
  );
}
