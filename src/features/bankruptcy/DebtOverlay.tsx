'use client';

import { useTranslations } from 'next-intl';
import { useDialog } from '@/shared/hooks/useDialog';
import { GAME_BOARD_COLORS, BOARD_TILE_COLORS } from '@/features/game-board/game-board.colors';

export interface DebtOverlayProps {
  amount:     number;
  canPay:     boolean;
  onPay:      () => void;
  onManage:   () => void;
  onBankrupt: () => void;
}

export function DebtOverlay({ amount, canPay, onPay, onManage, onBankrupt }: DebtOverlayProps) {
  const t = useTranslations('Debt');
  const dialog = useDialog<HTMLDivElement>({ label: t('paymentDue') });

  return (
    <div
      {...dialog}
      className="flex h-full w-full flex-col overflow-y-auto rounded-[16px] border focus:outline-none"
      style={{
        backgroundColor: GAME_BOARD_COLORS.surface,
        borderColor: GAME_BOARD_COLORS.border,
      }}
    >
      {/* Accent strip */}
      <div style={{ height: '4px', backgroundColor: BOARD_TILE_COLORS.propertyRed, flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex shrink-0 flex-col items-center gap-1 px-5 py-3"
        style={{
          backgroundColor: GAME_BOARD_COLORS.panel,
          borderBottom: `1px solid ${GAME_BOARD_COLORS.border}`,
        }}
      >
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚠️</span>
        <p
          className="font-mono font-semibold uppercase"
          style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: GAME_BOARD_COLORS.muted, marginTop: '4px' }}
        >
          {t('paymentDue')}
        </p>
        <p
          className="font-display font-black"
          style={{ fontSize: '1.8rem', color: BOARD_TILE_COLORS.propertyRed, lineHeight: 1.1 }}
        >
          M{amount}
        </p>
      </div>

      {/* Status message */}
      <div
        className="shrink-0 px-5 py-2 text-center"
        style={{ borderBottom: `1px solid ${GAME_BOARD_COLORS.border}` }}
      >
        <p
          className="font-sans"
          style={{ fontSize: '0.82rem', color: GAME_BOARD_COLORS.muted }}
        >
          {canPay ? t('canCover') : t('cantCover')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-2 px-5 py-4">
        <button
          type="button"
          onClick={onPay}
          disabled={!canPay}
          className="w-full rounded-[10px] border py-2.5 font-display font-bold uppercase tracking-wide transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            backgroundColor: BOARD_TILE_COLORS.propertyGreen,
            borderColor: BOARD_TILE_COLORS.propertyGreen,
            color: BOARD_TILE_COLORS.altText,
          }}
        >
          {t('pay', { amount })}
        </button>
        <button
          type="button"
          onClick={onManage}
          className="w-full rounded-[10px] border py-2.5 font-display font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            backgroundColor: GAME_BOARD_COLORS.panel,
            borderColor: GAME_BOARD_COLORS.border,
            color: GAME_BOARD_COLORS.text,
          }}
        >
          {t('manageProperties')}
        </button>
        <button
          type="button"
          onClick={onBankrupt}
          className="w-full rounded-[10px] border py-2.5 font-display font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            backgroundColor: 'transparent',
            borderColor: BOARD_TILE_COLORS.propertyRed,
            color: BOARD_TILE_COLORS.propertyRed,
          }}
        >
          {t('declareBankruptcy')}
        </button>
      </div>
    </div>
  );
}
