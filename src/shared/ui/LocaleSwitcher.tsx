'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { setLocale } from '@/app/actions';
import type { Locale } from '@/i18n/request';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const next: Locale = locale === 'uk' ? 'en' : 'uk';

  function toggle() {
    startTransition(async () => {
      await setLocale(next);
      window.location.reload();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="rounded-sm border border-line-2 bg-surface px-2 py-0.5 font-mono text-xs font-semibold text-muted transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-50"
      title={locale === 'uk' ? 'Switch to English' : 'Переключити на українську'}
    >
      {next.toUpperCase()}
    </button>
  );
}
