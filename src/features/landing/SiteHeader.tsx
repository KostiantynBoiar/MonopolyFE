import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MobileNav } from './MobileNav';
import { Badge, Container, ThemeToggle } from '@/shared/ui';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher';

export async function SiteHeader() {
  const t = await getTranslations('Landing');

  const navLinks = [
    { href: '/how-to-play', label: t('howToPlay') },
    { href: '/leaderboard', label: t('leaderboard') },
  ] as const;

  return (
    <header className="relative border-b border-line bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/home" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 rounded-sm">
          <Badge variant="gold" className="h-8 w-8 px-0 text-sm font-semibold">
            T
          </Badge>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            TYCOON
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
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
          <UserMenu />
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
