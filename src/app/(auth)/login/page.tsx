import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" prompt="Don't have an account?" linkHref="/register" linkLabel="Sign up">
      <LoginForm />
    </AuthCard>
  );
}
