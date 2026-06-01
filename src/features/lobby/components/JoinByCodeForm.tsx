'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { inviteCodeSchema } from '../lobby.schema';

export interface JoinByCodeFormProps {
  onSubmit: (code: string) => Promise<void>;
}

export function JoinByCodeForm({ onSubmit }: JoinByCodeFormProps) {
  const t = useTranslations('Lobby');
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Normalize and prefix: strip non-alphanumeric, uppercase, cap at 7 visible chars (TYC-XXXX)
  function handleChange(val: string) {
    const stripped = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    // If user types without "TYC-" prefix, prepend it
    const normalized = stripped.startsWith('TYC-') ? stripped : `TYC-${stripped.replace(/^TYC-?/, '')}`;
    setRaw(normalized.slice(0, 8)); // "TYC-XXXX" = 8 chars
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = inviteCodeSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid code');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isValid = raw.length === 8 && /^TYC-[A-Z0-9]{4}$/.test(raw);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={raw}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="TYC-XXXX"
            maxLength={8}
            spellCheck={false}
            className={cn(
              'h-9 w-full rounded-sm border bg-surface px-3 font-mono text-sm tracking-widest text-ink placeholder:text-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1',
              error ? 'border-red' : 'border-line-2',
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!isValid || loading}
          className={cn(
            'h-9 shrink-0 rounded-sm border px-4 font-semibold text-sm transition-colors',
            isValid && !loading
              ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
              : 'cursor-not-allowed border-line bg-paper text-muted',
          )}
        >
          {loading ? t('joining') : t('join')}
        </button>
      </div>
      {error && <p className="font-sans text-xs text-red">{error}</p>}
    </form>
  );
}
