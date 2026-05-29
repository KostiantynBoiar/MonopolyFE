import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue hover:underline focus-visible:outline-none"
          >
            Sign in
          </Link>
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
