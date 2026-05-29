import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          {"Don't have an account? "}
          <Link
            href="/register"
            className="font-medium text-blue hover:underline focus-visible:outline-none"
          >
            Sign up
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
