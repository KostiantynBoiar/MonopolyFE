'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import type { AuctionPanelProps } from '../auction.types';

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `0:${String(s).padStart(2, '0')}`;
}

export function AuctionOverlay({ auctionState, propertyName, viewerId, players, canBid: canBidPermission, onBid }: AuctionPanelProps) {
  const t = useTranslations('Auction');
  const [bidInput, setBidInput] = useState('');
  // Client-side countdown — re-syncs to server value on each new snapshot.
  const [displayMs, setDisplayMs] = useState(auctionState.timeRemainingMs);

  useEffect(() => {
    setDisplayMs(auctionState.timeRemainingMs);
  }, [auctionState.timeRemainingMs]);

  // Single stable interval — functional setState always sees the current value,
  // so this doesn't need displayMs as a dep (which would restart the clock every tick).
  useEffect(() => {
    const iv = setInterval(() => setDisplayMs((ms) => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const highestBidder = players.find((p) => p.id === auctionState.highestBidderId);
  const minBid = auctionState.highestBid + 1;
  const parsedBid = parseInt(bidInput, 10);
  // canBidPermission: server says we're allowed to bid at all
  // input validity: the entered amount is a valid number >= minimum
  const canBid = canBidPermission && !isNaN(parsedBid) && parsedBid >= minBid;
  const isUrgent = displayMs <= 4000;

  function submitBid() {
    if (!canBid) return;
    onBid(parsedBid);
    setBidInput('');
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-line bg-ink px-3 py-2 text-center">
        <div
          className="font-mono font-bold uppercase tracking-widest text-white/60"
          style={{ fontSize: '0.6em' }}
        >
          {t('header')}
        </div>
        <div className="font-display font-black uppercase text-white" style={{ fontSize: '0.85em' }}>
          {propertyName}
        </div>
      </div>

      {/* Timer + current bid */}
      <div className="shrink-0 flex items-center justify-around border-b border-line bg-line/30 px-3 py-2">
        <div className="text-center">
          <div
            className={cn(
              'font-mono font-bold tabular-nums transition-colors',
              isUrgent ? 'text-red' : 'text-ink',
            )}
            style={{ fontSize: '1.4em' }}
          >
            {formatTime(displayMs)}
          </div>
          <div
            className="font-sans uppercase tracking-wide text-muted"
            style={{ fontSize: '0.55em' }}
          >
            {t('timeLeft')}
          </div>
        </div>

        <div className="h-8 w-px bg-line" />

        <div className="text-center">
          <div className="font-display font-black text-ink" style={{ fontSize: '1.1em' }}>
            {auctionState.highestBid > 0 ? `M${auctionState.highestBid}` : '—'}
          </div>
          <div
            className="font-sans uppercase tracking-wide text-muted"
            style={{ fontSize: '0.55em' }}
          >
            {highestBidder?.name ?? t('noBids')}
          </div>
        </div>
      </div>

      {/* Bid history */}
      <div
        className="flex flex-1 flex-col-reverse gap-px overflow-y-auto px-2 py-1.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d0c4 transparent' }}
      >
        {auctionState.bids.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="font-sans italic text-muted" style={{ fontSize: '0.68em' }}>
              {t('noBidsYet')}
            </span>
          </div>
        ) : (
          [...auctionState.bids].reverse().map((bid, i) => {
            const bidder = players.find((p) => p.id === bid.playerId);
            const isViewer = bid.playerId === viewerId;
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded px-2 py-0.5 hover:bg-line/30"
              >
                <span
                  className={cn(
                    'font-sans',
                    isViewer ? 'font-semibold text-blue' : 'text-ink',
                  )}
                  style={{ fontSize: '0.68em' }}
                >
                  {bidder?.name ?? bid.playerId}
                </span>
                <span className="font-mono text-ink" style={{ fontSize: '0.68em' }}>
                  M{bid.amount}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Bid input */}
      <div className="shrink-0 border-t border-line bg-line/30 p-2">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <span
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-muted"
              style={{ fontSize: '0.7em' }}
            >
              M
            </span>
            <input
              type="number"
              min={minBid}
              value={bidInput}
              onChange={(e) => setBidInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitBid()}
              placeholder={String(minBid)}
              className="h-8 w-full rounded border border-line-2 bg-surface pl-5 pr-2 font-mono text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
              style={{ fontSize: '0.78em' }}
            />
          </div>
          <button
            onClick={submitBid}
            disabled={!canBid}
            className="rounded border border-blue bg-blue px-3 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted"
            style={{ fontSize: '0.62em' }}
          >
            {t('bid')}
          </button>
        </div>
        <p className="mt-0.5 font-sans text-muted" style={{ fontSize: '0.55em' }}>
          {t('minimumBid', { min: minBid })}
        </p>
      </div>
    </div>
  );
}
