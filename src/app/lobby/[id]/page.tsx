'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Waiting room now lives at /game/room. This redirect handles stale links.
export default function LobbyRoomRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/game/room'); }, [router]);
  return null;
}
