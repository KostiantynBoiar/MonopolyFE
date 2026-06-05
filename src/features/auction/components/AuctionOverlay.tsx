'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useDialog } from '@/shared/hooks/useDialog';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import type { AuctionPanelProps } from '../auction.types';

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `0:${String(s).padStart(2, '0')}`;
}

export function AuctionOverlay({
  auctionState, propertyName, viewerId, players, canBid: canBidPermission, onBid,
}: AuctionPanelProps) {
  const t = useTranslations('Auction');
  const dialog = useDialog<HTMLDivElement>({ label: t('header') });
  const [bidInput, setBidInput] = useState('');
  const [displayMs, setDisplayMs] = useState(auctionState.timeRemainingMs);

  useEffect(() => {
    setDisplayMs(auctionState.timeRemainingMs);
  }, [auctionState.timeRemainingMs]);

  // Single stable interval — functional setState sees current value without needing dep.
  useEffect(() => {
    const iv = setInterval(() => setDisplayMs((ms) => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const highestBidder = players.find((p) => p.id === auctionState.highestBidderId);
  const minBid = auctionState.highestBid + 1;
  const parsedBid = parseInt(bidInput, 10);
  const canBid = canBidPermission && !isNaN(parsedBid) && parsedBid >= minBid;
  const isUrgent = displayMs <= 4000;

  function submitBid() {
    if (!canBid) return;
    onBid(parsedBid);
    setBidInput('');
  }

  return (
    <div
      {...dialog}
      className="flex h-full flex-col overflow-hidden rounded-[16px] border focus:outline-none"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {/* Accent strip — yellow = value/auction */}
      <div style={{ height: '4px', backgroundColor: BOARD_TILE_COLORS.propertyYellow, flexShrink: 0 }} />

      {/* Header */}
      <div
        className="shrink-0 px-5 py-3"
        style={{
          backgroundColor: GAME_BOARD_COLORS.panel,
          borderBottom: `1px solid ${GAME_BOARD_COLORS.border}`,
        }}
      >
        <p
          className="font-mono font-semibold uppercase"
          style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: GAME_BOARD_COLORS.muted }}
        >
          {t('header')}
        </p>
        <h2
          className="font-display font-black uppercase leading-tight"
          style={{ fontSize: '1.1rem', color: GAME_BOARD_COLORS.text }}
        >
          {propertyName}
        </h2>
      </div>

      {/* Stats row — timer and current bid */}
      <div
        className="flex shrink-0 items-center px-5 py-3"
        style={{
          gap: '1.25rem',
          borderBottom: `1px solid ${GAME_BOARD_COLORS.border}`,
        }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="font-mono font-black tabular-nums"
            style={{
              fontSize: '1.7rem',
              lineHeight: 1,
              color: isUrgent ? BOARD_TILE_COLORS.propertyRed : GAME_BOARD_COLORS.text,
              transition: 'color 0.2s',
            }}
          >
            {formatTime(displayMs)}
          </span>
          <span
            className="font-mono font-semibold uppercase"
            style={{ fontSize: '0.55rem', letterSpacing: '0.14em', color: GAME_BOARD_COLORS.muted }}
          >
            {t('timeLeft')}
          </span>
        </div>

        <div
          style={{ width: '1px', height: '38px', backgroundColor: GAME_BOARD_COLORS.border, flexShrink: 0 }}
        />

        <div className="flex flex-col items-center gap-0.5">
          <span
            className="font-display font-black"
            style={{ fontSize: '1.5rem', lineHeight: 1, color: GAME_BOARD_COLORS.text }}
          >
            {auctionState.highestBid > 0 ? `M${auctionState.highestBid}` : '—'}
          </span>
          <span
            className="font-mono font-semibold uppercase truncate max-w-[8rem]"
            style={{ fontSize: '0.55rem', letterSpacing: '0.14em', color: GAME_BOARD_COLORS.muted }}
          >
            {highestBidder?.name ?? t('noBids')}
          </span>
        </div>
      </div>

      {/* Bid history */}
      <div
        className="flex flex-1 flex-col-reverse gap-px overflow-y-auto px-3 py-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${GAME_BOARD_COLORS.border} transparent` }}
      >
        {auctionState.bids.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <span
              className="font-sans italic"
              style={{ fontSize: '0.8rem', color: GAME_BOARD_COLORS.muted }}
            >
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
                className="flex items-center justify-between rounded-[8px] px-3 py-1.5"
                style={{
                  backgroundColor: isViewer
                    ? `${BOARD_TILE_COLORS.propertyBlue}1a`
                    : 'transparent',
                }}
              >
                <span
                  className="font-sans"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isViewer ? 700 : 500,
                    color: isViewer ? BOARD_TILE_COLORS.propertyBlue : GAME_BOARD_COLORS.text,
                  }}
                >
                  {bidder?.name ?? bid.playerId}
                </span>
                <span
                  className="font-mono font-semibold"
                  style={{ fontSize: '0.8rem', color: GAME_BOARD_COLORS.text }}
                >
                  M{bid.amount}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Bid input */}
      <div
        className="shrink-0 px-4 py-3"
        style={{
          borderTop: `1px solid ${GAME_BOARD_COLORS.border}`,
          backgroundColor: GAME_BOARD_COLORS.panel,
        }}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono font-semibold select-none"
              style={{ fontSize: '0.8rem', color: GAME_BOARD_COLORS.muted }}
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
              className="h-9 w-full rounded-[8px] border pl-7 pr-3 font-mono focus:outline-none"
              style={{
                fontSize: '0.82rem',
                backgroundColor: GAME_BOARD_COLORS.surface,
                borderColor: GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.text,
              }}
            />
          </div>
          <button
            type="button"
            onClick={submitBid}
            disabled={!canBid}
            className="rounded-[8px] border px-4 font-display font-bold uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              backgroundColor: BOARD_TILE_COLORS.propertyYellow,
              borderColor: BOARD_TILE_COLORS.propertyYellow,
              color: BOARD_TILE_COLORS.altText,
            }}
          >
            {t('bid')}
          </button>
        </div>
        <p
          className="mt-1 font-sans"
          style={{ fontSize: '0.62rem', color: GAME_BOARD_COLORS.muted }}
        >
          {t('minimumBid', { min: minBid })}
        </p>
      </div>
    </div>
  );
}
