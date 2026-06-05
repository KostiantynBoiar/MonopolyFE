import { env } from '@/shared/config/env';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  rating: number;
  games_played: number;
  calibration_complete: boolean;
}

// Public endpoint — no auth needed (the landing nav links here for logged-out visitors).
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${env.apiUrl}/api/v1/leaderboard?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status})`);
  const data = (await res.json()) as { items: LeaderboardEntry[] };
  return data.items;
}
