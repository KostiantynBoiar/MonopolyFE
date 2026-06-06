'use client';

import { useEffect, useState } from 'react';
import type { WsErrorPayload } from '@/shared/socket';

const WS_ERROR_SHAKE_DURATION_MS = 450;

export function useOnWsError(error: WsErrorPayload | null): boolean {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!error) {
      setIsShaking(false);
      return;
    }

    // Depend on the object reference, not a derived string, so repeated errors
    // with identical content (same code/message) still retrigger the animation.
    setIsShaking(true);
    const id = window.setTimeout(() => setIsShaking(false), WS_ERROR_SHAKE_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [error]);  

  return isShaking;
}
