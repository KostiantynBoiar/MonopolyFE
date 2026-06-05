'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { RatingBadge } from '@/shared/ui/RatingBadge';
import type { SessionSummary } from '../lobby.types';

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function playerCountColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 1) return 'text-red';
  if (ratio >= 0.75) return 'text-gold';
  return 'text-green';
}

function PlayerPips({ count, max }: { count: number; max: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          className={cn('h-1.5 w-1.5 rounded-full', index < count ? 'bg-ink' : 'bg-line')}
        />
      ))}
    </div>
  );
}

export interface SessionCardProps {
  session: SessionSummary;
  onJoin: (id: string) => void;
  isJoining?: boolean;
  /** Blocks joining while the player already has an active game to return to. */
  disabled?: boolean;
}

export function SessionCard({ session, onJoin, isJoining, disabled }: SessionCardProps) {
  const t = useTranslations('Lobby');
  const isFull = session.member_count >= session.max_players;
  const cannotJoin = isFull || disabled;

  return (
    <div className="flex items-center gap-4 rounded-sm border border-line bg-surface px-4 py-3 transition-shadow hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
          <span className="truncate">{session.host.display_name}&apos;s game</span>
          <RatingBadge
            rating={session.host.rating}
            provisional={!session.host.calibration_complete}
          />
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">
          {session.invite_code}
          <span className="mx-1.5 text-line">-</span>
          {timeAgo(session.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn('font-mono text-xs font-semibold tabular-nums', playerCountColor(session.member_count, session.max_players))}>
          {session.member_count} / {session.max_players}
        </span>
        <PlayerPips count={session.member_count} max={session.max_players} />
      </div>

      <button
        type="button"
        onClick={() => onJoin(session.id)}
        disabled={cannotJoin || isJoining}
        className={cn(
          'ml-2 shrink-0 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors',
          cannotJoin
            ? 'cursor-not-allowed border-line bg-paper text-muted'
            : 'border-blue bg-blue text-white hover:bg-blue-600',
          isJoining && 'opacity-60',
        )}
      >
        {isFull ? t('full') : isJoining ? t('joining') : t('join')}
      </button>
    </div>
  );
}
