import type { Metadata } from 'next';
import { DM_Mono, Fraunces, Roboto_Flex } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { IconSprite } from '@/shared/ui/IconSprite';
import { ThemeProvider } from '@/shared/ui/ThemeProvider';
import './globals.css';

const themeScript = `try{var s=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d))document.documentElement.classList.add('dark')}catch(e){}`;

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600'],
  style: ['normal', 'italic'],
});

// Roboto Flex is a variable font with Cyrillic support — required for Ukrainian text.
const robotoFlex = Roboto_Flex({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-hanken', // reuses existing CSS var so Tailwind config is unchanged
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'TYCOON',
    template: '%s | TYCOON',
  },
  description: 'Play the classic property game online with friends.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${fraunces.variable} ${robotoFlex.variable} ${dmMono.variable}`}>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <IconSprite />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
