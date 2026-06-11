'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/FormField';
import { OrDivider } from '@/shared/ui/OrDivider';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslations } from 'next-intl';
import { loginSchema } from '../auth.schema';
import type { LoginInput } from '../auth.schema';
import { translateAuthError } from '../translateAuthError';
import { OAuthButtons } from './OAuthButtons';

export function LoginForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [fields, setFields] = useState<LoginInput>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginInput>>({});

  function handleChange(key: keyof LoginInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
      clearError();
    };
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(fields);
    if (!parsed.success) {
      const fe: Partial<LoginInput> = {};
      for (const err of parsed.error.errors) {
        fe[err.path[0] as keyof LoginInput] = translateAuthError(t, err.message);
      }
      setFieldErrors(fe);
      return;
    }
    try {
      await login(parsed.data.email, parsed.data.password);
      router.push('/lobby');
    } catch {
      // error is stored in the auth store
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        id="email"
        label={t('email')}
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        value={fields.email}
        onChange={handleChange('email')}
        error={fieldErrors.email}
        disabled={isLoading}
      />

      <FormField
        id="password"
        label={t('password')}
        type="password"
        autoComplete="current-password"
        placeholder={t('passwordPlaceholder')}
        value={fields.password}
        onChange={handleChange('password')}
        error={fieldErrors.password}
        disabled={isLoading}
      />

      {error && (
        <p className="rounded-sm bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
      )}

      <Button
        type="submit"
        variant="dark"
        disabled={isLoading}
        className="w-full mt-1"
      >
        {isLoading ? t('signingIn') : t('signIn')}
      </Button>

      <OrDivider>{t('orContinueWith')}</OrDivider>
      <OAuthButtons />
    </form>
  );
}
