import { SiteHeader } from '@/features/landing/SiteHeader';

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-paper">{children}</main>
    </>
  );
}
