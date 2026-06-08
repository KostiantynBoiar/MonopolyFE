'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tycoon:lobby:ranked';

export function useRankedPreference() {
  const [ranked, setRankedState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setRankedState(stored === 'true');
    }
  }, []);

  const setRanked = useCallback((value: boolean) => {
    setRankedState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  return [ranked, setRanked] as const;
}
