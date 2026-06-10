import type { Metadata } from 'next';
import { FeatureRow } from '@/features/landing/FeatureRow';
import { Hero } from '@/features/landing/Hero';
import { getOnlinePlayerCount } from '@/shared/lib/stats';

export const metadata: Metadata = {
  title: 'TYCOON — Play the classic property game online',
  description:
    'Real-time multiplayer property trading. Create a private table, invite friends, and negotiate deals in-session.',
  openGraph: {
    title: 'TYCOON — Play the classic property game online',
    description:
      'Real-time multiplayer property trading. Create a private table, invite friends, and negotiate deals in-session.',
    type: 'website',
  },
};

export default async function HomePage() {
  const onlineCount = await getOnlinePlayerCount();

  return (
    <>
      <Hero onlineCount={onlineCount} />
      <FeatureRow />
    </>
  );
}
