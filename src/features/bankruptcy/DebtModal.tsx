'use client';

export type DebtModalProps = {
  amount:       number;
  canPay:       boolean;
  onPay:        () => void;
  onManage:     () => void;   // open Manage to mortgage/sell and raise cash
  onBankrupt:   () => void;
};

export function DebtModal({ amount, canPay, onPay, onManage, onBankrupt }: DebtModalProps) {
  return (
    <div className="flex w-[13em] flex-col overflow-hidden rounded-xl border-2 border-red bg-white shadow-2xl">
      <div className="flex shrink-0 flex-col items-center justify-end bg-red px-2 pb-1.5 pt-2">
        <span className="mb-0.5 leading-none" style={{ fontSize: '1.1em' }}>⚠️</span>
        <span className="font-mono font-bold uppercase tracking-widest text-white/80" style={{ fontSize: '0.55em' }}>
          Payment Due
        </span>
        <span className="font-display font-black uppercase text-white" style={{ fontSize: '0.9em' }}>
          M{amount}
        </span>
      </div>

      <div className="border-b border-ink/20 px-3 py-1.5 text-center">
        <span className="font-sans text-muted" style={{ fontSize: '0.6em' }}>
          {canPay ? 'You can cover this.' : 'Raise cash by mortgaging or selling — or declare bankruptcy.'}
        </span>
      </div>

      <div className="flex flex-col gap-1 px-2 py-2">
        <button
          onClick={onPay}
          disabled={!canPay}
          className="rounded bg-green py-1 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#186444] active:scale-95 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          style={{ fontSize: '0.6em' }}
        >
          Pay M{amount}
        </button>
        <button
          onClick={onManage}
          className="rounded border border-ink bg-surface py-1 font-display font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper active:scale-95"
          style={{ fontSize: '0.6em' }}
        >
          Manage Properties
        </button>
        <button
          onClick={onBankrupt}
          className="rounded border border-red bg-surface py-1 font-display font-bold uppercase tracking-wide text-red transition-colors hover:bg-red/10 active:scale-95"
          style={{ fontSize: '0.6em' }}
        >
          Declare Bankruptcy
        </button>
      </div>
    </div>
  );
}
