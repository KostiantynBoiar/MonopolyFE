'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Mode = 'light' | 'dark' | 'system';
export type BoardTheme = 'classic' | 'midnight' | 'sepia' | 'noir';
export type DiceTheme = 'sync' | 'ruby' | 'ivory' | 'onyx' | 'emerald' | 'gold';

/** Resolved display mode after system preference is applied. */
export type ResolvedMode = 'light' | 'dark';

interface ThemeContextValue {
  /** Stored preference: 'light' | 'dark' | 'system'. */
  mode: Mode;
  /** Resolved to 'light' | 'dark' (system is evaluated). Backward-compat alias: `theme`. */
  theme: ResolvedMode;
  boardTheme: BoardTheme;
  diceTheme: DiceTheme;
  setMode: (m: Mode) => void;
  setBoardTheme: (b: BoardTheme) => void;
  setDiceTheme: (d: DiceTheme) => void;
  /** Quick toggle light↔dark (backward-compatible with ThemeToggle). */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  theme: 'light',
  boardTheme: 'classic',
  diceTheme: 'sync',
  setMode: () => {},
  setBoardTheme: () => {},
  setDiceTheme: () => {},
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function systemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveMode(mode: Mode): ResolvedMode {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

function applyMode(mode: Mode) {
  document.documentElement.classList.toggle('dark', resolveMode(mode) === 'dark');
}

function applyBoardTheme(boardTheme: BoardTheme) {
  if (boardTheme === 'classic') {
    document.documentElement.removeAttribute('data-board-theme');
  } else {
    document.documentElement.setAttribute('data-board-theme', boardTheme);
  }
}

function applyDiceTheme(diceTheme: DiceTheme) {
  if (diceTheme === 'sync') {
    document.documentElement.removeAttribute('data-dice-theme');
  } else {
    document.documentElement.setAttribute('data-dice-theme', diceTheme);
  }
}

function getInitialMode(): Mode {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('theme') as Mode | null) ?? 'system';
}

function getInitialBoardTheme(): BoardTheme {
  if (typeof window === 'undefined') return 'classic';
  return (localStorage.getItem('board-theme') as BoardTheme | null) ?? 'classic';
}

function getInitialDiceTheme(): DiceTheme {
  if (typeof window === 'undefined') return 'sync';
  return (localStorage.getItem('dice-theme') as DiceTheme | null) ?? 'sync';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(getInitialMode);
  const [boardTheme, setBoardThemeState] = useState<BoardTheme>(getInitialBoardTheme);
  const [diceTheme, setDiceThemeState] = useState<DiceTheme>(getInitialDiceTheme);

  // Track resolved mode for context consumers (e.g. ThemeToggle icon).
  const [resolved, setResolved] = useState<ResolvedMode>(() => resolveMode(getInitialMode()));

  useEffect(() => {
    applyMode(mode);
    applyBoardTheme(boardTheme);
    applyDiceTheme(diceTheme);

    if (mode !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = resolveMode('system');
      setResolved(r);
      applyMode('system');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [boardTheme, diceTheme, mode]);

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem('theme', m);
    const r = resolveMode(m);
    setResolved(r);
  }

  function setBoardTheme(b: BoardTheme) {
    setBoardThemeState(b);
    localStorage.setItem('board-theme', b);
  }

  function setDiceTheme(d: DiceTheme) {
    setDiceThemeState(d);
    localStorage.setItem('dice-theme', d);
  }

  function toggle() {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ mode, theme: resolved, boardTheme, diceTheme, setMode, setBoardTheme, setDiceTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
