import type { Metadata } from 'next';
import { Roboto_Flex } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { IconSprite } from '@/shared/ui/IconSprite';
import { ThemeProvider } from '@/shared/ui/ThemeProvider';
import './globals.css';

const themeScript = `try{var s=localStorage.getItem('theme'),b=localStorage.getItem('board-theme'),d=localStorage.getItem('dice-theme'),sys=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s==='system'&&sys)||(s===null&&sys))document.documentElement.classList.add('dark');if(b&&b!=='classic')document.documentElement.setAttribute('data-board-theme',b);if(d&&d!=='sync')document.documentElement.setAttribute('data-dice-theme',d)}catch(e){}`;

const robotoFlex = Roboto_Flex({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-roboto-flex',
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
    <html lang={locale} suppressHydrationWarning className={robotoFlex.variable}>
      { }
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
