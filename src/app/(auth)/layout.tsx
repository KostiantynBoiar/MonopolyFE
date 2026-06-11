import type { ReactNode } from 'react';
import { Brand } from '@/shared/ui/Brand';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-paper flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Brand className="justify-center mb-8" />
        {children}
      </div>
    </div>
  );
}
