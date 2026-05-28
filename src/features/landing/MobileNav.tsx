'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Container, Icon } from '@/shared/ui';

const navLinks = [
  { href: '/how-to-play', label: 'How to play' },
  { href: '/leaderboard', label: 'Leaderboard' },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name={open ? 'close' : 'menu'} />
      </Button>

      {open && (
        <nav
          id="mobile-nav-panel"
          className="absolute left-0 right-0 top-16 z-50 border-b border-line bg-surface shadow-md"
          aria-label="Mobile"
        >
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-sm px-2 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
              <Button as="a" href="/login" variant="ghost" size="sm" onClick={close}>
                Log in
              </Button>
              <Button as="a" href="/register" variant="dark" size="sm" onClick={close}>
                Sign up
              </Button>
            </div>
          </Container>
        </nav>
      )}
    </div>
  );
}
