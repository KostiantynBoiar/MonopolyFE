'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Brand, Button, Container } from '@/shared/ui';
import { useAuthStore } from '@/stores/auth-store';

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MePage() {
  const t = useTranslations('Profile');
  const locale = useLocale();
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
        <p className="text-sm text-muted">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-line bg-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Brand />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push('/home');
            }}
          >
            {t('signOut')}
          </Button>
        </Container>
      </header>

      <main className="min-h-[calc(100svh-4rem)]">
        <Container className="flex min-h-[calc(100svh-4rem)] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <h1 className="mb-1 text-2xl font-semibold text-ink">{t('title')}</h1>
            <p className="mb-8 text-sm text-muted">{t('subtitle')}</p>

            <div className="rounded-lg border border-line bg-surface divide-y divide-line">
              <ProfileRow label={t('displayName')} value={user.display_name} />
              <ProfileRow label={t('email')} value={user.email} />
              <ProfileRow label={t('memberSince')} value={formatDate(user.created_at, locale)} />
              <ProfileRow label={t('userId')} value={user.id} mono />
            </div>

            <div className="mt-6">
              <Button as="a" href="/lobby" variant="blue">
                {t('goToLobby')}
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
