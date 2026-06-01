'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import { PropertyColor, TOKEN_COLORS, COLOR_GROUP, COLOR_GROUP_ORDER } from '../player-panel.schema';
import type { Player } from '../player-panel.schema';

const BAND_BG: Record<PropertyColor, string> = {
  [PropertyColor.BROWN]:  'bg-band-brown',
  [PropertyColor.CYAN]:   'bg-band-cyan',
  [PropertyColor.PINK]:   'bg-band-pink',
  [PropertyColor.ORANGE]: 'bg-band-orange',
  [PropertyColor.RED]:    'bg-band-red',
  [PropertyColor.YELLOW]: 'bg-band-yellow',
  [PropertyColor.GREEN]:  'bg-band-green',
  [PropertyColor.BLUE]:   'bg-band-blue',
};

function groupOwned(positions: number[]): Map<PropertyColor, number[]> {
  const out = new Map<PropertyColor, number[]>();
  for (const pos of positions) {
    const color = COLOR_GROUP[pos];
    if (color) {
      const arr = out.get(color) ?? [];
      arr.push(pos);
      out.set(color, arr);
    }
  }
  return out;
}

const GROUP_SIZE: Record<PropertyColor, number> = {
  [PropertyColor.BROWN]: 2,
  [PropertyColor.CYAN]: 3,
  [PropertyColor.PINK]: 3,
  [PropertyColor.ORANGE]: 3,
  [PropertyColor.RED]: 3,
  [PropertyColor.YELLOW]: 3,
  [PropertyColor.GREEN]: 3,
  [PropertyColor.BLUE]: 2,
};

interface PlayerCardProps {
  player: Player;
  className?: string;
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  const t = useTranslations('Player');
  const { name, balance, token, ownedPositions, isActive, isBankrupt, inJail, jailTurns } = player;
  const tokenBg = TOKEN_COLORS[token];
  const groups = groupOwned(ownedPositions);
  const hasProperties = ownedPositions.length > 0;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 rounded border bg-surface p-3 transition-shadow',
        isActive && 'shadow-md ring-2',
        isBankrupt && 'opacity-50',
        className,
      )}
      style={isActive ? { '--tw-ring-color': tokenBg } as React.CSSProperties : undefined}
    >
      {/* Active turn indicator */}
      {isActive && (
        <span
          className="absolute -left-px top-3 w-[3px] rounded-r"
          style={{ background: tokenBg, height: 20 }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center gap-2">
        {/* Token dot */}
        <span
          className="h-7 w-7 shrink-0 rounded-full border-2 border-white shadow-sm"
          style={{ background: tokenBg }}
          aria-label={`${name} token`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'truncate font-sans text-sm font-semibold text-ink',
                isBankrupt && 'line-through',
              )}
            >
              {name}
            </span>
            {isActive && (
              <span className="shrink-0 rounded-sm bg-gold-50 px-1 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-gold-600">
                {t('turn')}
              </span>
            )}
            {inJail && (
              <span className="shrink-0 rounded-sm bg-red/10 px-1 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-red">
                {jailTurns != null ? t('jailTurns', { turns: jailTurns }) : t('jail')}
              </span>
            )}
          </div>

          {/* Balance */}
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono text-[11px] font-bold text-muted">M</span>
            <span className="font-mono text-sm font-semibold text-ink">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Property color groups */}
      {hasProperties && (
        <div className="flex flex-wrap gap-1">
          {COLOR_GROUP_ORDER.map((color) => {
            const owned = groups.get(color);
            if (!owned) return null;
            const total = GROUP_SIZE[color] as number;
            const isSet = owned.length === total;

            return (
              <div key={color} className="flex items-center gap-[2px]">
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2.5 w-2.5 rounded-[2px] border',
                      i < owned.length
                        ? cn(BAND_BG[color], isSet ? 'border-ink' : 'border-ink/40')
                        : 'border-line bg-paper',
                    )}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
