'use client';

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'tycoon:lobby:ranked';

function getInitialRankedPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function useRankedPreference() {
  const [ranked, setRankedState] = useState(getInitialRankedPreference);

  const setRanked = useCallback((value: boolean) => {
    setRankedState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  return [ranked, setRanked] as const;
}
