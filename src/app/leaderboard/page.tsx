'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Container, RatingBadge } from '@/shared/ui';
import { fetchLeaderboard, type LeaderboardEntry } from '@/features/leaderboard/api';

const RANK_STYLES: Record<number, string> = {
  1: 'text-gold',
  2: 'text-muted',
  3: 'text-band-orange',
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((items) => { if (!cancelled) setRows(items); })
      .catch((e) => { if (!cancelled) setError((e as Error).message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-svh bg-paper py-10">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide text-ink">
              Leaderboard
            </h1>
            <p className="mt-1 text-sm text-muted">Top tycoons by ELO rating.</p>
          </div>
          <Button as="a" href="/lobby" variant="blue">
            Back to lobby
          </Button>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 text-right font-semibold">Rating</th>
                <th className="px-4 py-3 text-right font-semibold">Games</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-red">{error}</td></tr>
              )}
              {!error && rows === null && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">Loading…</td></tr>
              )}
              {!error && rows?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">No ranked players yet — play a game!</td></tr>
              )}
              {rows?.map((row) => (
                <tr
                  key={row.user_id}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper"
                >
                  <td className={`px-4 py-3 font-display font-black ${RANK_STYLES[row.rank] ?? 'text-ink'}`}>
                    {row.rank}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {row.display_name}
                    {!row.calibration_complete && (
                      <Badge variant="neutral" className="ml-2 normal-case">provisional</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RatingBadge rating={row.rating} provisional={!row.calibration_complete} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{row.games_played}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          New players are <strong>provisional</strong> for their first 3 games (bigger swings).{' '}
          <Link href="/" className="text-blue underline">Home</Link>
        </p>
      </Container>
    </main>
  );
}
