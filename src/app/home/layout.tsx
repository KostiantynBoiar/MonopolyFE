import { SiteFooter, SiteHeader } from '@/features/landing';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
