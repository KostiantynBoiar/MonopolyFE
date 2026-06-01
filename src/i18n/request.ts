import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export type Locale = 'uk' | 'en';
export const LOCALES: Locale[] = ['uk', 'en'];
export const DEFAULT_LOCALE: Locale = 'uk';

export default getRequestConfig(async () => {
  const raw = (await cookies()).get('NEXT_LOCALE')?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
