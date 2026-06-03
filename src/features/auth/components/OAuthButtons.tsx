'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';

type OAuthButtonProps = {
  provider: 'google' | 'telegram';
  onClick?: () => void;
  disabled?: boolean;
};

function OAuthButton({ provider, onClick, disabled }: OAuthButtonProps) {
  const t = useTranslations('Auth');
  const isGoogle = provider === 'google';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 w-full appearance-none items-center justify-center gap-2.5 rounded-sm border px-4 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isGoogle
          ? 'border-line-2 bg-surface text-ink shadow-sm hover:bg-paper'
          : 'border-[#1a8fc9] bg-[#2AABEE] text-white shadow-sm hover:bg-[#1a9fde]',
      )}
    >
      {isGoogle ? <GoogleIcon /> : <TelegramIcon />}
      {isGoogle ? t('socialGoogle') : t('socialTelegram')}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
      <path
        d="M1.126 8.618 15.48 3.027c.695-.25 1.302.17 1.077 1.22l-2.454 11.562c-.18.81-.664.007-.664.007L9.87 11.98l-2.54 2.38s-.29.225-.587.084l.338-4.847 7.205-6.504c.313-.28-.068-.435-.484-.156L3.498 10.62l-2.97-.934c-.646-.203-.658-.645.598-1.068Z"
        fill="white"
      />
    </svg>
  );
}

type OAuthButtonsProps = {
  disabled?: boolean;
};

export function OAuthButtons({ disabled }: OAuthButtonsProps) {
  const t = useTranslations('Auth');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <OAuthButton provider="google"   disabled />
        <OAuthButton provider="telegram" disabled />
      </div>
      <p className="text-center font-sans text-xs text-muted">
        {t('socialLoginComingSoon')}
      </p>
    </div>
  );
}
