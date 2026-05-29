'use client';

import { useRef, useEffect, useState } from 'react';
import { MonopolyBoard } from './MonopolyBoard';
import { BoardContainerProps } from '../game-board.types';
import { BASE_PX } from '@/shared/config/constants';

export function BoardContainer({ centerContent, spaces, players }: BoardContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const fit = Math.min(width, height);
      setScale(Math.max(0.3, fit / BASE_PX));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center overflow-hidden">
      <MonopolyBoard
        scale={scale}
        centerContent={centerContent}
        spaces={spaces}
        players={players}
      />
    </div>
  );
}
