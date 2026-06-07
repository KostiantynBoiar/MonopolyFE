'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light');
  const [boardTheme, setBoardThemeState] = useState<BoardTheme>('classic');
  const [diceTheme, setDiceThemeState] = useState<DiceTheme>('sync');

  // Track resolved mode for context consumers (e.g. ThemeToggle icon).
  const [resolved, setResolved] = useState<ResolvedMode>('light');

  // System preference listener ref — cleaned up if mode changes away from 'system'.
  const mqlCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const storedMode: Mode = (localStorage.getItem('theme') as Mode | null) ?? 'system';
    const storedBoard = (localStorage.getItem('board-theme') as BoardTheme | null) ?? 'classic';
    const storedDice = (localStorage.getItem('dice-theme') as DiceTheme | null) ?? 'sync';

    setModeState(storedMode);
    setBoardThemeState(storedBoard);
    setDiceThemeState(storedDice);
    setResolved(resolveMode(storedMode));
    applyMode(storedMode);
    applyBoardTheme(storedBoard);
    applyDiceTheme(storedDice);

    if (storedMode === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const r = resolveMode('system');
        setResolved(r);
        applyMode('system');
      };
      mql.addEventListener('change', handler);
      mqlCleanupRef.current = () => mql.removeEventListener('change', handler);
    }

    return () => mqlCleanupRef.current?.();
  }, []);

  function setMode(m: Mode) {
    mqlCleanupRef.current?.();
    mqlCleanupRef.current = null;

    setModeState(m);
    localStorage.setItem('theme', m);
    const r = resolveMode(m);
    setResolved(r);
    applyMode(m);

    if (m === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const next = resolveMode('system');
        setResolved(next);
        applyMode('system');
      };
      mql.addEventListener('change', handler);
      mqlCleanupRef.current = () => mql.removeEventListener('change', handler);
    }
  }

  function setBoardTheme(b: BoardTheme) {
    setBoardThemeState(b);
    localStorage.setItem('board-theme', b);
    applyBoardTheme(b);
  }

  function setDiceTheme(d: DiceTheme) {
    setDiceThemeState(d);
    localStorage.setItem('dice-theme', d);
    applyDiceTheme(d);
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
