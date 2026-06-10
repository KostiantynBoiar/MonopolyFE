'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

const CODE_PATTERN = /^TYC-[A-Z0-9]{4}$/;

export function JoinWithCode() {
  const t = useTranslations('Landing');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const code = value.trim().toUpperCase();

    if (!CODE_PATTERN.test(code)) {
      setError(t('invalidCode'));
      return;
    }

    setError('');
    router.push(`/game/room?code=${encodeURIComponent(code)}`);
  };

  if (!expanded) {
    return (
      <Button variant="ghost" onClick={() => setExpanded(true)}>
        {t('joinWithCode')}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <label htmlFor="join-code" className="sr-only">
            {t('gameCode')}
          </label>
          <Input
            ref={inputRef}
            id="join-code"
            name="code"
            placeholder={t('gameCodePlaceholder')}
            value={value}
            error={Boolean(error)}
            onChange={(event) => {
              setValue(event.target.value.toUpperCase());
              if (error) setError('');
            }}
            className="font-mono uppercase sm:w-36"
            aria-describedby={error ? 'join-code-error' : undefined}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p id="join-code-error" className="text-xs text-red" role="alert">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" variant="blue" size="sm" className="sm:mt-0">
          {t('join')}
        </Button>
      </div>
    </form>
  );
}
