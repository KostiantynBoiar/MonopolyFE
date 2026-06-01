'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslations } from 'next-intl';
import { registerSchema } from '../auth.schema';
import type { RegisterInput } from '../auth.schema';
import { OAuthButtons } from './OAuthButtons';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [fields, setFields] = useState<RegisterInput>({
    email: '',
    password: '',
    display_name: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<RegisterInput>>({});

  function handleChange(key: keyof RegisterInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
      clearError();
    };
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(fields);
    if (!parsed.success) {
      const fe: Partial<RegisterInput> = {};
      for (const err of parsed.error.errors) {
        fe[err.path[0] as keyof RegisterInput] = err.message;
      }
      setFieldErrors(fe);
      return;
    }
    try {
      await register(parsed.data.email, parsed.data.password, parsed.data.display_name);
      router.push('/lobby');
    } catch {
      // error is stored in the auth store
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className="text-sm font-medium text-ink">
          {t('displayName')}
        </label>
        <Input
          id="display_name"
          type="text"
          autoComplete="nickname"
          placeholder={t('displayNamePlaceholder')}
          value={fields.display_name}
          onChange={handleChange('display_name')}
          error={!!fieldErrors.display_name}
          disabled={isLoading}
        />
        {fieldErrors.display_name && (
          <p className="text-xs text-red">{fieldErrors.display_name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {t('email')}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          value={fields.email}
          onChange={handleChange('email')}
          error={!!fieldErrors.email}
          disabled={isLoading}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red">{fieldErrors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          {t('password')}
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={t('passwordMinLength')}
          value={fields.password}
          onChange={handleChange('password')}
          error={!!fieldErrors.password}
          disabled={isLoading}
        />
        {fieldErrors.password && (
          <p className="text-xs text-red">{fieldErrors.password}</p>
        )}
      </div>

      {error && (
        <p className="rounded-sm bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
      )}

      <Button
        type="submit"
        variant="dark"
        disabled={isLoading}
        className="w-full mt-1"
      >
        {isLoading ? t('creatingAccount') : t('createAccount')}
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 border-t border-line" />
        <span className="text-xs text-muted">{t('orContinueWith')}</span>
        <div className="flex-1 border-t border-line" />
      </div>
      <OAuthButtons disabled={isLoading} />
    </form>
  );
}
