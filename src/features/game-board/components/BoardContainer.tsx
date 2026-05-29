'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { MonopolyBoard } from './MonopolyBoard';

const BASE_PX = 686;

type BoardContainerProps = {
  centerContent?: ReactNode;
};

export function BoardContainer({ centerContent }: BoardContainerProps) {
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
      <MonopolyBoard scale={scale} centerContent={centerContent} />
    </div>
  );
}
