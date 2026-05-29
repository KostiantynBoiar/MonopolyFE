'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Container } from '@/shared/ui';
import { useAuthStore } from '@/stores/auth-store';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MePage() {
  const { user, token, isLoading, logout, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!user) fetchMe();
  }, [token, user, fetchMe, router]);

  if (!token || isLoading || !user) {
    return (
      <div className="min-h-svh bg-paper flex items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-line bg-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/home"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 rounded-sm"
          >
            <Badge variant="gold" className="h-8 w-8 px-0 text-sm font-semibold">
              T
            </Badge>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              TYCOON
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push('/home');
            }}
          >
            Sign out
          </Button>
        </Container>
      </header>

      <main>
        <Container className="py-12">
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold text-ink mb-1">Profile</h1>
            <p className="text-sm text-muted mb-8">Your account details</p>

            <div className="rounded-lg border border-line bg-surface divide-y divide-line">
              <ProfileRow label="Display name" value={user.display_name} />
              <ProfileRow label="Email" value={user.email} />
              <ProfileRow label="Member since" value={formatDate(user.created_at)} />
              <ProfileRow label="User ID" value={user.id} mono />
            </div>

            <div className="mt-6">
              <Button as="a" href="/lobby" variant="blue">
                Go to lobby
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <span className="text-sm text-muted shrink-0">{label}</span>
      <span
        className={`text-sm text-ink text-right break-all ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
