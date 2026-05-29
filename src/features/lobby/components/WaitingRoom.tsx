'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/cn';
import { MemberRole } from '../lobby.enums';
import { SESSION_MIN_PLAYERS_TO_START } from '@/shared/config/constants';
import type { SessionDetail } from '../lobby.types';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="rounded border border-line-2 bg-surface px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-ink hover:text-ink"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ name, role }: { name: string; role: MemberRole }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="h-2 w-2 rounded-full bg-ink/30" />
      <span className="flex-1 font-sans text-sm text-ink">{name}</span>
      {role === MemberRole.HOST && (
        <span className="rounded-sm bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-gold">
          Host
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export type WaitingRoomProps = {
  session: SessionDetail;
  onLeave: () => Promise<void>;
  onStart: () => Promise<void>;
};

export function WaitingRoom({ session, onLeave, onStart }: WaitingRoomProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = session.your_role === MemberRole.HOST;
  const canStart = isHost && session.member_count >= SESSION_MIN_PLAYERS_TO_START;

  async function handleLeave() {
    setLeaving(true);
    try {
      await onLeave();
      router.push('/lobby');
    } catch (err) {
      setError((err as Error).message);
      setLeaving(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    try {
      await onStart();
      router.push('/game/room');
    } catch (err) {
      setError((err as Error).message);
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Invite code card */}
      <div className="mb-6 rounded-sm border border-line bg-surface p-5">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          Invite code
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-ink">
            {session.invite_code}
          </span>
          <CopyButton text={session.invite_code} />
        </div>
        <p className="mt-2 font-sans text-xs text-muted">
          Share this code so friends can join your game.
        </p>
      </div>

      {/* Members */}
      <div className="mb-6 rounded-sm border border-line bg-surface px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
            Players
          </p>
          <span className="font-mono text-xs text-muted">
            {session.member_count} / {session.max_players}
          </span>
        </div>
        <div className="divide-y divide-line/50">
          {session.members.map((m) => (
            <MemberRow key={m.user_id} name={m.display_name} role={m.role} />
          ))}
        </div>
        {session.member_count < SESSION_MIN_PLAYERS_TO_START && (
          <p className="mt-2 font-sans text-xs italic text-muted">
            Waiting for at least {SESSION_MIN_PLAYERS_TO_START} players to start…
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 rounded-sm border border-red/30 bg-red/5 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="rounded-sm border border-line-2 bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper disabled:opacity-60"
        >
          {leaving ? 'Leaving…' : 'Leave'}
        </button>

        {isHost && (
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className={cn(
              'flex-1 rounded-sm border px-4 py-2 text-sm font-semibold transition-colors',
              canStart && !starting
                ? 'border-gold-600 bg-gold text-white hover:bg-gold-600'
                : 'cursor-not-allowed border-line bg-paper text-muted',
            )}
          >
            {starting ? 'Starting…' : canStart ? 'Start Game' : `Need ${SESSION_MIN_PLAYERS_TO_START}+ players`}
          </button>
        )}
      </div>
    </div>
  );
}
