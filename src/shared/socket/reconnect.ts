// Exponential backoff with jitter for WebSocket reconnect scheduling.
import { JITTER_RATIO, BASE_DELAY_MS, MAX_DELAY_MS } from '@/shared/config/constants';

export function backoffDelay(attempt: number): number {
  const exp    = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jitter = exp * JITTER_RATIO * (Math.random() * 2 - 1);
  return Math.round(exp + jitter);
}
