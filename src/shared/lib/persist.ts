/**
 * Schema version shared by every persisted zustand store.
 *
 * Bump this whenever the shape of any persisted slice changes in a backwards-incompatible
 * way. `migratePersistedState` then drops the now-stale localStorage entry so returning
 * users fall back to clean defaults instead of hydrating a mismatched shape (which surfaces
 * as subtle bugs like a stale `currentSession` pointing at a finished game).
 */
export const PERSIST_VERSION = 1;

/**
 * Standard `migrate` for zustand `persist`. It only runs when the stored version differs
 * from {@link PERSIST_VERSION}:
 *  - `fromVersion === 0` is pre-versioning state whose shape already matches v1, so keep it
 *    (avoids logging everyone out / wiping chat the first time versioning ships).
 *  - any other gap means the persisted shape predates a breaking change → discard it.
 */
export function migratePersistedState<T>(persisted: unknown, fromVersion: number): T {
  return (fromVersion === 0 ? persisted : undefined) as T;
}
