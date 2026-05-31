import type { Metadata } from 'next';
import { DM_Mono, Fraunces, Hanken_Grotesk } from 'next/font/google';
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

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  weight: ['400', '500', '600', '700'],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${hanken.variable} ${dmMono.variable}`}>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <IconSprite />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
