import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MobileNav } from './MobileNav';
import { Brand } from '@/shared/ui/Brand';
import { Container } from '@/shared/ui/Container';
import { SettingsControl } from '@/shared/ui/SettingsControl';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher';

export async function SiteHeader() {
  const t = await getTranslations('Landing');

  const navLinks = [
    { href: '/lobby', label: t('lobbies') },
    { href: '/how-to-play', label: t('howToPlay') },
    { href: '/leaderboard', label: t('leaderboard') },
  ] as const;

  return (
    <header className="relative border-b border-line bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav className="hidden items-center gap-6 md:flex" aria-label={t('mainNavigation')}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 rounded-sm"
            >
              {link.label}
            </Link>
          ))}
          <LocaleSwitcher />
          <ThemeToggle />
          <SettingsControl />
          <UserMenu />
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
