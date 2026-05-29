'use client';

import { cn } from '@/shared/lib/cn';
import type { SessionSummary } from '../lobby.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function playerCountColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 1)   return 'text-red';
  if (ratio >= 0.75) return 'text-gold';
  return 'text-green';
}

// ─── Player pips ──────────────────────────────────────────────────────────────

function PlayerPips({ count, max }: { count: number; max: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            i < count ? 'bg-ink' : 'bg-line',
          )}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export type SessionCardProps = {
  session: SessionSummary;
  onJoin: (id: string) => void;
  isJoining?: boolean;
};

export function SessionCard({ session, onJoin, isJoining }: SessionCardProps) {
  const isFull = session.member_count >= session.max_players;

  return (
    <div className="flex items-center gap-4 rounded-sm border border-line bg-surface px-4 py-3 transition-shadow hover:shadow-sm">
      {/* Left: host + code */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-ink">
          {session.host.display_name}&apos;s game
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">
          {session.invite_code}
          <span className="mx-1.5 text-line">·</span>
          {timeAgo(session.created_at)}
        </p>
      </div>

      {/* Center: player count */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'font-mono text-xs font-semibold tabular-nums',
            playerCountColor(session.member_count, session.max_players),
          )}
        >
          {session.member_count} / {session.max_players}
        </span>
        <PlayerPips count={session.member_count} max={session.max_players} />
      </div>

      {/* Right: join button */}
      <button
        onClick={() => onJoin(session.id)}
        disabled={isFull || isJoining}
        className={cn(
          'ml-2 shrink-0 rounded-sm border px-3 py-1.5 font-semibold text-xs transition-colors',
          isFull
            ? 'cursor-not-allowed border-line bg-paper text-muted'
            : 'border-blue bg-blue text-white hover:bg-blue-600',
          isJoining && 'opacity-60',
        )}
      >
        {isFull ? 'Full' : isJoining ? 'Joining…' : 'Join →'}
      </button>
    </div>
  );
}
