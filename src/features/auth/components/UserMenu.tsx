'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Button } from '@/shared/ui';
import { useAuthStore } from '@/stores/auth-store';

export function UserMenu() {
  const { user, token, logout, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token && !user) fetchMe();
  }, [token, user, fetchMe]);

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/me"
          className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 rounded-sm"
        >
          <Avatar name={user.display_name} />
          {user.display_name}
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
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button as="a" href="/login" variant="ghost" size="sm">
        Log in
      </Button>
      <Button as="a" href="/register" variant="dark" size="sm">
        Sign up
      </Button>
    </div>
  );
}
