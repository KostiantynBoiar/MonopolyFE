// Exponential backoff with jitter for WebSocket reconnect scheduling.

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS  = 30_000;
const JITTER_RATIO  = 0.2;   // ±20% randomisation to spread reconnect storms

export function backoffDelay(attempt: number): number {
  const exp    = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jitter = exp * JITTER_RATIO * (Math.random() * 2 - 1);
  return Math.round(exp + jitter);
}
