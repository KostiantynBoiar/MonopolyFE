'use client';

import { useEffect, useState } from 'react';
import type { WsErrorPayload } from '@/shared/protocol/messages.schema';

const WS_ERROR_SHAKE_DURATION_MS = 450;

export function useOnWsError(error: WsErrorPayload | null): boolean {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!error) return;

    // Depend on the object reference, not a derived string, so repeated errors
    // with identical content (same code/message) still retrigger the animation.
    const startId = window.setTimeout(() => setIsShaking(true), 0);
    const id = window.setTimeout(() => setIsShaking(false), WS_ERROR_SHAKE_DURATION_MS);
    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(id);
    };
  }, [error]);  

  return error ? isShaking : false;
}
