'use client';

import { useEffect, useState } from 'react';
import type { WsErrorPayload } from '@/shared/socket';

const WS_ERROR_SHAKE_DURATION_MS = 450;

function getWsErrorKey(error: WsErrorPayload | null): string | null {
  if (!error) return null;
  return `${error.code}:${error.message}:${error.ref_seq ?? ''}`;
}

export function useOnWsError(error: WsErrorPayload | null): boolean {
  const [isShaking, setIsShaking] = useState(false);
  const errorKey = getWsErrorKey(error);

  useEffect(() => {
    if (!errorKey) {
      setIsShaking(false);
      return;
    }

    setIsShaking(true);
    const timeoutId = window.setTimeout(() => setIsShaking(false), WS_ERROR_SHAKE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [errorKey]);

  return isShaking;
}
