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

  function handleChange(value: string) {
    const stripped = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const normalized = stripped.startsWith('TYC-') ? stripped : `TYC-${stripped.replace(/^TYC-?/, '')}`;
    setRaw(normalized.slice(0, 8));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
        <input
          value={raw}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="TYC-XXXX"
          maxLength={8}
          spellCheck={false}
          className={cn(
            'h-9 w-full rounded-sm border bg-surface px-3 font-mono text-sm tracking-widest text-ink placeholder:text-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1',
            error ? 'border-red' : 'border-line-2',
          )}
        />
        <button
          type="submit"
          disabled={!isValid || loading}
          className={cn(
            'h-9 shrink-0 rounded-sm border px-4 text-sm font-semibold transition-colors',
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
