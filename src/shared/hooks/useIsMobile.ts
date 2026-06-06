'use client';

import { useEffect, useState } from 'react';

// Tailwind md = 768px. Mobile layout applies below it.
export function useIsMobile(maxWidthPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false); // SSR-safe default
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [maxWidthPx]);
  return isMobile;
}
