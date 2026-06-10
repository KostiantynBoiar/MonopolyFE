import { SiteFooter } from '@/features/landing/SiteFooter';
import { SiteHeader } from '@/features/landing/SiteHeader';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
