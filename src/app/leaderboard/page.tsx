'use client';

import Link from 'next/link';
import { Badge, Button, Container } from '@/shared/ui';

// Mock leaderboard — placeholder until the real ranking API/feature lands.
interface LeaderboardRow {
  rank: number;
  name: string;
  wins: number;
  games: number;
  netWorth: number;
}

const MOCK_ROWS: LeaderboardRow[] = [
  { rank: 1, name: 'Penis',     wins: 42, games: 58, netWorth: 18450 },
  { rank: 2, name: 'Alice',     wins: 37, games: 61, netWorth: 16200 },
  { rank: 3, name: 'Bob',       wins: 31, games: 55, netWorth: 14980 },
  { rank: 4, name: 'Carol',     wins: 28, games: 60, netWorth: 13110 },
  { rank: 5, name: 'Dmytro',    wins: 24, games: 49, netWorth: 12740 },
  { rank: 6, name: 'Eve',       wins: 19, games: 44, netWorth: 10880 },
  { rank: 7, name: 'Frank',     wins: 15, games: 41, netWorth: 9320 },
  { rank: 8, name: 'Grace',     wins: 11, games: 38, netWorth: 7650 },
];

const RANK_STYLES: Record<number, string> = {
  1: 'text-gold',
  2: 'text-muted',
  3: 'text-band-orange',
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-svh bg-paper py-10">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide text-ink">
              Leaderboard
            </h1>
            <p className="mt-1 text-sm text-muted">
              Top tycoons by wins. <Badge>Mock data</Badge>
            </p>
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
                <th className="px-4 py-3 text-right font-semibold">Wins</th>
                <th className="px-4 py-3 text-right font-semibold">Games</th>
                <th className="px-4 py-3 text-right font-semibold">Best net worth</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ROWS.map((row) => (
                <tr
                  key={row.rank}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper"
                >
                  <td className={`px-4 py-3 font-display font-black ${RANK_STYLES[row.rank] ?? 'text-ink'}`}>
                    {row.rank}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">{row.wins}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{row.games}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    M{row.netWorth.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Rankings are placeholder data — the real leaderboard is coming soon.{' '}
          <Link href="/" className="text-blue underline">
            Home
          </Link>
        </p>
      </Container>
    </main>
  );
}
