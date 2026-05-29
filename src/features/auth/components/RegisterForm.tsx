'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/stores/auth-store';
import { registerSchema } from '../auth.schema';
import { TelegramLoginWidget } from './TelegramLoginWidget';
import { env } from '@/shared/config/env';

type Fields = { email: string; password: string; display_name: string };

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [fields, setFields] = useState<Fields>({
    email: '',
    password: '',
    display_name: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Fields>>({});

  function handleChange(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
      clearError();
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(fields);
    if (!parsed.success) {
      const fe: Partial<Fields> = {};
      for (const err of parsed.error.errors) {
        fe[err.path[0] as keyof Fields] = err.message;
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
          Display name
        </label>
        <Input
          id="display_name"
          type="text"
          autoComplete="nickname"
          placeholder="Tycoon Player"
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
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
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
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
        {isLoading ? 'Creating account…' : 'Create account'}
      </Button>

      {env.telegramBotName && (
        <>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-line" />
            <span className="text-xs text-muted">or continue with</span>
            <div className="flex-1 border-t border-line" />
          </div>
          <div className="flex justify-center">
            <TelegramLoginWidget />
          </div>
        </>
      )}
    </form>
  );
}
