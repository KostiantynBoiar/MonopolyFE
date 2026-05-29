'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { env } from '@/shared/config/env';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export function TelegramLoginWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { clearError } = useAuthStore();
  const botName = env.telegramBotName;

  useEffect(() => {
    if (!botName || !containerRef.current) return;

    window.onTelegramAuth = async (_user: TelegramUser) => {
      clearError();
      // TODO: POST /api/v1/auth/telegram with user data, then set store token
      // const { user, token } = await loginWithTelegram(user);
      // useAuthStore.setState({ user, token: token.access_token });
      router.push('/lobby');
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '6');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botName, clearError, router]);

  if (!botName) return null;

  return <div ref={containerRef} />;
}
