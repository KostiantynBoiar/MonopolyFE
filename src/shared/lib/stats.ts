import { MOCK_ONLINE_PLAYER_COUNT } from '@/shared/mocks/landing.mock';

export async function getOnlinePlayerCount(): Promise<number | undefined> {
  // TODO(backend): replace mock with fetch to `${API_URL}/stats/online`
  // when backend is ready. Keep return type + undefined-on-error contract.
  return MOCK_ONLINE_PLAYER_COUNT;
}
