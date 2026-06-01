'use server';

import { cookies } from 'next/headers';
import { LOCALES, type Locale } from '@/i18n/request';

export async function setLocale(locale: Locale): Promise<void> {
  if (!LOCALES.includes(locale)) return;
  (await cookies()).set('NEXT_LOCALE', locale, {
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
  });
}
