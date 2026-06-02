'use client';

import { useTranslations } from 'next-intl';
import { TOKEN_COLORS } from '@/features/player-panel';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';
import { BOARD } from '@/shared/config/board-layout';
import { TradeParty } from '../trade.enums';
import type { TradeWindowProps } from '../trade.types';
import type { TradeOffer } from '@/shared/protocol/game-state.schema';
import { DeedWindow } from '@/features/deed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function JailFreeCard({ count }: { count: number }) {
  const t = useTranslations('Trade');
  return (
    <div
      className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5"
      style={{
        border: `1px solid ${GAME_BOARD_COLORS.border}`,
        backgroundColor: GAME_BOARD_COLORS.panel,
      }}
    >
      <span style={{ fontSize: '0.85em' }}>🎴</span>
      <span
        className="font-sans"
        style={{ fontSize: '0.75rem', color: GAME_BOARD_COLORS.text }}
      >
        {count}× {t('jailFree')}
      </span>
    </div>
  );
}

function NothingLabel() {
  const t = useTranslations('Trade');
  return (
    <span
      className="font-sans italic"
      style={{ fontSize: '0.78rem', color: GAME_BOARD_COLORS.muted }}
    >
      {t('nothing')}
    </span>
  );
}

function resolveViewerRole(viewerId: string, proposerId: string, targetId: string): TradeParty {
  if (viewerId === proposerId) return TradeParty.PROPOSER;
  if (viewerId === targetId)   return TradeParty.TARGET;
  return TradeParty.OBSERVER;
}

function formatMoney(amount: number): string {
  return `M ${amount.toLocaleString()}`;
}

// ─── One side of the trade ────────────────────────────────────────────────────

interface OfferSideProps {
  name:    string;
  token:   string;
  balance: number;
  offer:   TradeOffer;
  label:   string;
  dimmed?: boolean;
}

function OfferSide({ name, token, balance, offer, label, dimmed }: OfferSideProps) {
  const tokenHex = TOKEN_COLORS[token as keyof typeof TOKEN_COLORS] ?? '#888';
  const isEmpty = offer.money === 0 && offer.positions.length === 0 && offer.getOutOfJailCards === 0;
  const spaces = offer.positions
    .map((pos) => BOARD[pos])
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-3 p-4"
      style={{ opacity: dimmed ? 0.5 : 1 }}
    >
      {/* Player header */}
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: tokenHex }}
        />
        <span
          className="min-w-0 truncate font-display font-bold"
          style={{ fontSize: '0.9rem', color: GAME_BOARD_COLORS.text }}
        >
          {name}
        </span>
        <span
          className="ml-auto shrink-0 font-mono font-semibold"
          style={{ fontSize: '0.72rem', color: GAME_BOARD_COLORS.muted }}
        >
          {formatMoney(balance)}
        </span>
      </div>

      {/* Offer role label */}
      <span
        className="font-mono font-semibold uppercase"
        style={{ fontSize: '0.62rem', letterSpacing: '0.18em', color: GAME_BOARD_COLORS.muted }}
      >
        {label}
      </span>

      {/* Money + jail cards */}
      <div className="flex flex-wrap gap-2">
        {offer.money > 0 && (
          <div
            className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5"
            style={{
              border: `1px solid ${GAME_BOARD_COLORS.border}`,
              backgroundColor: GAME_BOARD_COLORS.panel,
            }}
          >
            <span style={{ fontSize: '0.85em' }}>💰</span>
            <span
              className="font-mono font-semibold"
              style={{ fontSize: '0.8rem', color: GAME_BOARD_COLORS.text }}
            >
              {formatMoney(offer.money)}
            </span>
          </div>
        )}
        {offer.getOutOfJailCards > 0 && (
          <JailFreeCard count={offer.getOutOfJailCards} />
        )}
      </div>

      {/* Deed cards */}
      {spaces.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ fontSize: '0.72em' }}
        >
          {spaces.map((space) => (
            <div key={space.pos} className="shrink-0">
              <DeedWindow space={space} viewOnly />
            </div>
          ))}
        </div>
      )}

      {isEmpty && <NothingLabel />}
    </div>
  );
}

// ─── TradeOverlay ─────────────────────────────────────────────────────────────

export function TradeOverlay({
  trade, proposer, target, viewerId,
  onAccept, onReject, onCounter, onCancel,
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

  const statusText =
    viewerRole === TradeParty.TARGET    ? t('sentOffer', { name: proposer.name })
    : viewerRole === TradeParty.PROPOSER ? t('waitingFor', { name: target.name })
    : t('exchange', { proposer: proposer.name, target: target.name });

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: GAME_BOARD_COLORS.surface }}
    >
      {/* Accent strip — green = deal */}
      <div style={{ height: '4px', backgroundColor: BOARD_TILE_COLORS.propertyGreen, flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-3 px-5 py-3"
        style={{
          backgroundColor: GAME_BOARD_COLORS.panel,
          borderBottom: `1px solid ${GAME_BOARD_COLORS.border}`,
        }}
      >
        <h2
          className="font-display font-black uppercase"
          style={{ fontSize: '1rem', color: GAME_BOARD_COLORS.text }}
        >
          {t('header')}
        </h2>
        <span
          className="ml-auto font-sans italic"
          style={{ fontSize: '0.7rem', color: GAME_BOARD_COLORS.muted }}
        >
          {statusText}
        </span>
      </div>

      {/* Exchange area */}
      <div
        className="flex min-h-0 flex-1 overflow-hidden"
        style={{ borderBottom: `1px solid ${GAME_BOARD_COLORS.border}` }}
      >
        <OfferSide
          name={proposer.name}
          token={proposer.token}
          balance={proposer.balance}
          offer={trade.proposerOffer}
          label={proposerLabel}
          dimmed={viewerRole === TradeParty.TARGET}
        />

        <div style={{ width: '1px', backgroundColor: GAME_BOARD_COLORS.border, flexShrink: 0 }} />

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
      <div
        className="flex shrink-0 items-center justify-end gap-2 px-4 py-3"
        style={{
          backgroundColor: GAME_BOARD_COLORS.panel,
        }}
      >
        {viewerRole === TradeParty.TARGET && (
          <>
            <button
              type="button"
              onClick={onReject}
              className="rounded-[10px] border px-4 py-2 font-display font-bold uppercase transition-opacity hover:opacity-80"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.07em',
                backgroundColor: GAME_BOARD_COLORS.surface,
                borderColor: GAME_BOARD_COLORS.border,
                color: GAME_BOARD_COLORS.text,
              }}
            >
              {t('reject')}
            </button>
            {onCounter && (
              <button
                type="button"
                onClick={onCounter}
                className="rounded-[10px] border px-4 py-2 font-display font-bold uppercase transition-opacity hover:opacity-80"
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.07em',
                  backgroundColor: GAME_BOARD_COLORS.surface,
                  borderColor: GAME_BOARD_COLORS.border,
                  color: GAME_BOARD_COLORS.text,
                }}
              >
                {t('counter')}
              </button>
            )}
            <button
              type="button"
              onClick={onAccept}
              className="rounded-[10px] border px-4 py-2 font-display font-bold uppercase transition-opacity hover:opacity-90"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.07em',
                backgroundColor: BOARD_TILE_COLORS.propertyGreen,
                borderColor: BOARD_TILE_COLORS.propertyGreen,
                color: BOARD_TILE_COLORS.altText,
              }}
            >
              {t('accept')}
            </button>
          </>
        )}
        {viewerRole === TradeParty.PROPOSER && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[10px] border px-4 py-2 font-display font-bold uppercase transition-opacity hover:opacity-80"
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.07em',
              backgroundColor: 'transparent',
              borderColor: BOARD_TILE_COLORS.propertyRed,
              color: BOARD_TILE_COLORS.propertyRed,
            }}
          >
            {t('withdraw')}
          </button>
        )}
        {viewerRole === TradeParty.OBSERVER && (
          <span
            className="font-sans italic"
            style={{ fontSize: '0.72rem', color: GAME_BOARD_COLORS.muted }}
          >
            {t('spectating')}
          </span>
        )}
      </div>
    </div>
  );
}
