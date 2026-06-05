'use client';

import { useTranslations } from 'next-intl';
import { useDialog } from '@/shared/hooks/useDialog';
import { Icon } from './Icon';
import { cn } from '@/shared/lib/cn';
import { useTheme, type Mode, type BoardTheme, type DiceTheme } from './ThemeProvider';

interface SettingsDrawerProps {
  onClose: () => void;
}

// ── Board theme swatch data ──────────────────────────────────────────────────

type BoardThemeOption = {
  value: BoardTheme;
  /** Three representative band colors for the mini swatch. */
  swatchColors: [string, string, string];
  /** Board tile background for context. */
  tileColor: string;
};

const BOARD_THEME_OPTIONS: BoardThemeOption[] = [
  { value: 'classic',  swatchColors: ['#E48787', '#79B48F', '#74A2CA'], tileColor: '#F7F3EC' },
  { value: 'midnight', swatchColors: ['#ff3d3d', '#00e676', '#2196f3'], tileColor: '#121e35' },
  { value: 'sepia',    swatchColors: ['#a84040', '#4a7a58', '#4a6888'], tileColor: '#f0e4c8' },
  { value: 'noir',     swatchColors: ['#9a7070', '#708a78', '#7080a0'], tileColor: '#f5f5f5' },
];

// ── Dice theme swatch data ───────────────────────────────────────────────────

type DiceThemeOption = {
  value: DiceTheme;
  faceColor: string;
  pipColor: string;
};

const DICE_THEME_OPTIONS: DiceThemeOption[] = [
  { value: 'sync',    faceColor: 'var(--prop-red)', pipColor: '#fff' },
  { value: 'ruby',    faceColor: '#c0392b', pipColor: '#ffe6e6' },
  { value: 'ivory',   faceColor: '#f5f0e8', pipColor: '#3d3020' },
  { value: 'onyx',    faceColor: '#1b1b1f', pipColor: '#f5f5f5' },
  { value: 'emerald', faceColor: '#1a7a52', pipColor: '#d0ffe8' },
  { value: 'gold',    faceColor: '#c8a020', pipColor: '#fff8e0' },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
      {children}
    </p>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[10px] border border-line bg-paper p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-[7px] px-3 py-1.5 text-sm font-semibold transition-colors duration-150',
            value === opt.value
              ? 'bg-surface text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BoardThemePicker({
  value,
  onChange,
  labels,
}: {
  value: BoardTheme;
  onChange: (v: BoardTheme) => void;
  labels: Record<BoardTheme, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BOARD_THEME_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-start gap-1.5 rounded-[10px] border p-3 text-left transition-colors duration-150',
              active
                ? 'border-blue bg-blue/5 text-ink'
                : 'border-line bg-surface text-muted hover:border-line-2 hover:text-ink',
            )}
          >
            {/* Mini board swatch */}
            <div
              className="flex w-full gap-0.5 rounded-md p-1.5"
              style={{ backgroundColor: opt.tileColor }}
            >
              {opt.swatchColors.map((color, i) => (
                <span
                  key={i}
                  className="h-3 flex-1 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold">{labels[opt.value]}</span>
            {active && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function DieFaceSwatch({ faceColor, pipColor }: { faceColor: string; pipColor: string }) {
  const pips = [[30, 30], [50, 50], [70, 70]] as const;
  return (
    <div
      className="relative h-8 w-8 shrink-0 rounded-[6px]"
      style={{ backgroundColor: faceColor, border: '1px solid rgba(255,255,255,0.15)' }}
    >
      {pips.map(([x, y], i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${x}%`, top: `${y}%`, backgroundColor: pipColor }}
        />
      ))}
    </div>
  );
}

function DiceThemePicker({
  value,
  onChange,
  labels,
}: {
  value: DiceTheme;
  onChange: (v: DiceTheme) => void;
  labels: Record<DiceTheme, string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      {DICE_THEME_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-3 rounded-[8px] border px-3 py-2 text-left transition-colors duration-150',
              active
                ? 'border-blue bg-blue/5 text-ink'
                : 'border-line bg-surface text-muted hover:border-line-2 hover:text-ink',
            )}
          >
            <DieFaceSwatch faceColor={opt.faceColor} pipColor={opt.pipColor} />
            <span className="flex-1 text-sm font-medium">{labels[opt.value]}</span>
            {active && <span className="text-xs font-bold text-blue">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Main drawer ──────────────────────────────────────────────────────────────

export function SettingsDrawer({ onClose }: SettingsDrawerProps) {
  const t = useTranslations('Settings');
  const { mode, boardTheme, diceTheme, setMode, setBoardTheme, setDiceTheme } = useTheme();
  const dialogProps = useDialog<HTMLDivElement>({ onClose, label: t('title') });

  const modeOptions: Array<{ value: Mode; label: string }> = [
    { value: 'light',  label: t('light') },
    { value: 'dark',   label: t('dark') },
    { value: 'system', label: t('system') },
  ];

  const boardLabels: Record<BoardTheme, string> = {
    classic:  t('classic'),
    midnight: t('midnight'),
    sepia:    t('sepia'),
    noir:     t('noir'),
  };

  const diceLabels: Record<DiceTheme, string> = {
    sync:    t('sync'),
    ruby:    t('ruby'),
    ivory:   t('ivory'),
    onyx:    t('onyx'),
    emerald: t('emerald'),
    gold:    t('gold'),
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Drawer panel */}
      <div
        {...dialogProps}
        className="flex w-full max-w-sm flex-col gap-5 overflow-y-auto rounded-[16px] border border-line bg-surface p-5 shadow-lg outline-none"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-black uppercase tracking-[0.12em] text-ink">
            {t('title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-line hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Mode */}
        <section>
          <SectionLabel>{t('modeLabel')}</SectionLabel>
          <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
        </section>

        {/* Board theme */}
        <section>
          <SectionLabel>{t('boardThemeLabel')}</SectionLabel>
          <BoardThemePicker value={boardTheme} onChange={setBoardTheme} labels={boardLabels} />
        </section>

        {/* Dice theme */}
        <section>
          <SectionLabel>{t('diceThemeLabel')}</SectionLabel>
          <DiceThemePicker value={diceTheme} onChange={setDiceTheme} labels={diceLabels} />
        </section>
      </div>
    </div>
  );
}
