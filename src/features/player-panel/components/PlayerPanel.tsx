'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LogEntry, PropertyState } from '@/shared/protocol/game-state';
import { NORMAL_BOARD_CONFIG } from '@/shared/config/board-layout';
import { useBalanceChange } from '@/shared/hooks/useBalanceChange';
import { BOARD_TILE_COLORS, getSpaceHeaderColor } from '@/features/board-tile/boardTile.colors';
import { GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import type { Player } from '../player-panel.schema';
import type { BalanceDeltaEntry } from './BalanceDelta';
import { PlayerCard } from './PlayerCard';
import { useSessionTimer } from '../hooks/useSessionTimer';

interface PlayerPanelProps {
  players:      Player[];
  spaces?:      PropertyState[];
  log?:         LogEntry[];
  viewerId?:    string;
  createdAt?:   string;
  onSurrender?: () => void;
}

export function PlayerPanel({ players, spaces, log, createdAt, onSurrender }: PlayerPanelProps) {
  const t = useTranslations('Player');
  const currentPlayer = players.find((player) => player.isActive);
  const sessionTimer  = useSessionTimer(createdAt);

  const jailSpace = NORMAL_BOARD_CONFIG.spacesByPosition[NORMAL_BOARD_CONFIG.jailPosition];
  const jailColor = jailSpace ? getSpaceHeaderColor(jailSpace) : BOARD_TILE_COLORS.propertyOrange;

  const [surrenderConfirming, setSurrenderConfirming] = useState(false);
  useEffect(() => {
    if (!surrenderConfirming) return;
    const timer = setTimeout(() => setSurrenderConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [surrenderConfirming]);

  const [deltas, setDeltas] = useState<Map<string, BalanceDeltaEntry>>(new Map());
  const deltaCounterRef = useRef(0);
  useBalanceChange(players, (changes) => {
    setDeltas((prev) => {
      const next = new Map(prev);
      for (const { playerId, delta } of changes) {
        next.set(playerId, { id: ++deltaCounterRef.current, amount: delta });
      }
      return next;
    });
  }, log);

  const spaceState = new Map((spaces ?? []).map((s) => [s.position, s]));

  function clearDelta(playerId: string) {
    setDeltas((prev) => {
      const next = new Map(prev);
      next.delete(playerId);
      return next;
    });
  }

  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-[18px] border p-4"
      style={{
        backgroundColor: GAME_BOARD_COLORS.panel,
        borderColor: GAME_BOARD_COLORS.border,
        color: GAME_BOARD_COLORS.text,
      }}
    >
      {createdAt && (
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: GAME_BOARD_COLORS.muted }}
          >
            {t('session')}
          </span>
          <span
            className="font-mono text-[10px] font-black tabular-nums"
            style={{ color: GAME_BOARD_COLORS.muted }}
          >
            {sessionTimer}
          </span>
        </div>
      )}

      <div
        className="rounded-[14px] border px-3 py-3"
        style={{
          backgroundColor: BOARD_TILE_COLORS.propertyBlue,
          borderColor: BOARD_TILE_COLORS.propertyBlue,
          color: BOARD_TILE_COLORS.altText,
        }}
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]">
          {t('currentTurn')}
        </p>
        <p className="mt-1 truncate font-display text-2xl font-semibold">
          {currentPlayer?.name ?? t('waiting')}
        </p>
      </div>

      <div className="grid min-h-0 gap-3">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            spaceState={spaceState}
            jailColor={jailColor}
            delta={deltas.get(player.id)}
            onClearDelta={() => clearDelta(player.id)}
          />
        ))}
      </div>

      {onSurrender && (
        <button
          type="button"
          onClick={() => {
            if (surrenderConfirming) {
              onSurrender();
              setSurrenderConfirming(false);
            } else {
              setSurrenderConfirming(true);
            }
          }}
          className="mt-auto w-full shrink-0 rounded-[10px] border py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] transition-colors"
          style={{
            backgroundColor: surrenderConfirming ? BOARD_TILE_COLORS.propertyRed : 'transparent',
            borderColor: BOARD_TILE_COLORS.propertyRed,
            color: surrenderConfirming ? '#fff' : BOARD_TILE_COLORS.propertyRed,
          }}
        >
          {surrenderConfirming ? t('surrenderConfirm') : t('surrender')}
        </button>
      )}
    </aside>
  );
}
