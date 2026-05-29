'use client';

import { TOKEN_COLORS } from '@/features/player-panel';
import { BOARD } from '@/shared/config/board-layout';
import { cn } from '@/shared/lib/cn';
import { PropertyColor } from '@/features/game-board/game-board.enums';
import { TradeParty } from '../trade.enums';
import type { TradeWindowProps } from '../trade.types';
import type { TradeOffer } from '@/shared/protocol/game-state.schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_COLOR_HEX: Record<PropertyColor, string> = {
  [PropertyColor.BROWN]:  '#8B5513',
  [PropertyColor.CYAN]:   '#6EBEE3',
  [PropertyColor.PINK]:   '#D93A96',
  [PropertyColor.ORANGE]: '#F4861C',
  [PropertyColor.RED]:    '#D12730',
  [PropertyColor.YELLOW]: '#D4B800',
  [PropertyColor.GREEN]:  '#1E8449',
  [PropertyColor.BLUE]:   '#0047AB',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveViewerRole(viewerId: string, proposerId: string, targetId: string): TradeParty {
  if (viewerId === proposerId) return TradeParty.PROPOSER;
  if (viewerId === targetId)   return TradeParty.TARGET;
  return TradeParty.OBSERVER;
}

function formatMoney(amount: number): string {
  return `M ${amount.toLocaleString()}`;
}

// ─── Property chip ────────────────────────────────────────────────────────────

function PropertyChip({ position }: { position: number }) {
  const space = BOARD[position];
  const colorHex = space?.color ? PROPERTY_COLOR_HEX[space.color] : '#888';

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded bg-surface px-2 py-0.5">
      <span
        className="h-2 w-1 shrink-0 rounded-sm"
        style={{ background: colorHex }}
      />
      <span className="min-w-0 truncate font-sans text-[0.7em] text-ink">
        {space?.name ?? `Space ${position}`}
      </span>
    </div>
  );
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

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-2 p-3', dimmed && 'opacity-60')}>
      {/* Player info */}
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: tokenHex }}
        />
        <span className="min-w-0 truncate font-display text-[0.76em] font-bold text-ink">
          {name}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[0.62em] text-muted">
          {formatMoney(balance)}
        </span>
      </div>

      {/* Offer label */}
      <span className="font-mono text-[0.6em] font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>

      {/* Offer items */}
      <div className="flex flex-col gap-1">
        {offer.money > 0 && (
          <div className="flex items-center gap-1.5 rounded bg-surface px-2 py-0.5">
            <span className="shrink-0 text-[0.72em]">💰</span>
            <span className="font-mono text-[0.72em] font-semibold text-ink">
              {formatMoney(offer.money)}
            </span>
          </div>
        )}
        {offer.positions.map((pos) => (
          <PropertyChip key={pos} position={pos} />
        ))}
        {offer.getOutOfJailCards > 0 && (
          <div className="flex items-center gap-1.5 rounded bg-surface px-2 py-0.5">
            <span className="shrink-0 text-[0.72em]">🎴</span>
            <span className="font-sans text-[0.68em] text-ink">
              {offer.getOutOfJailCards}× Jail Free card
            </span>
          </div>
        )}
        {isEmpty && (
          <span className="font-sans text-[0.68em] italic text-muted">— nothing —</span>
        )}
      </div>
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
  onCancel,
}: TradeWindowProps) {
  const viewerRole = resolveViewerRole(viewerId, trade.proposerId, trade.targetId);

  // Frame the labels from the viewer's perspective
  const proposerLabel =
    viewerRole === TradeParty.PROPOSER ? 'You give'
    : viewerRole === TradeParty.TARGET  ? `${proposer.name} offers`
    : `${proposer.name} gives`;

  const targetLabel =
    viewerRole === TradeParty.TARGET    ? 'You give back'
    : viewerRole === TradeParty.PROPOSER ? `${target.name} gives back`
    : `${target.name} gives`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-gray-200 px-3 py-1.5">
        <span className="font-mono text-[0.68em] font-semibold uppercase tracking-widest text-muted">
          Trade Offer
        </span>
        {viewerRole !== TradeParty.OBSERVER && (
          <span className="ml-auto font-sans text-[0.62em] italic text-muted">
            {viewerRole === TradeParty.TARGET
              ? `${proposer.name} sent you an offer`
              : `Waiting for ${target.name}…`}
          </span>
        )}
      </div>

      {/* Exchange area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <OfferSide
          name={proposer.name}
          token={proposer.token}
          balance={proposer.balance}
          offer={trade.proposerOffer}
          label={proposerLabel}
          dimmed={viewerRole === TradeParty.TARGET}
        />

        {/* Exchange divider */}
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-1">
          <div className="h-12 w-px bg-line" />
          <span className="text-[0.9em] text-muted">⇄</span>
          <div className="h-12 w-px bg-line" />
        </div>

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
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-gray-200 px-3 py-2">
        {viewerRole === TradeParty.TARGET && (
          <>
            <button
              onClick={onReject}
              className="rounded border border-line-2 bg-surface font-display text-[0.62em] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
              style={{ padding: '0.55em 0.9em' }}
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="rounded border border-gold-600 bg-gold font-display text-[0.62em] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-600"
              style={{ padding: '0.55em 0.9em' }}
            >
              Accept
            </button>
          </>
        )}
        {viewerRole === TradeParty.PROPOSER && (
          <button
            onClick={onCancel}
            className="rounded border border-line-2 bg-surface font-display text-[0.62em] font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
            style={{ padding: '0.55em 0.9em' }}
          >
            Withdraw
          </button>
        )}
        {viewerRole === TradeParty.OBSERVER && (
          <span className="font-sans text-[0.68em] italic text-muted">
            Waiting for {target.name}…
          </span>
        )}
      </div>
    </div>
  );
}
