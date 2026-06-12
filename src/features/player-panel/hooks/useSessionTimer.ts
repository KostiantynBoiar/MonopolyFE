import { useEffect, useState } from 'react';

export function useSessionTimer(createdAt: string | undefined): string {
  const [elapsed, setElapsed] = useState(() =>
    createdAt ? Date.now() - new Date(createdAt).getTime() : 0,
  );

  useEffect(() => {
    if (!createdAt) return;
    const startMs = new Date(createdAt).getTime();
    const id = setInterval(() => setElapsed(Date.now() - startMs), 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const s = Math.floor(elapsed / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
