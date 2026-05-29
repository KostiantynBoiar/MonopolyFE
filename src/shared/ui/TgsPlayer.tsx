'use client';

import { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';

// Module-level cache — decompressed Lottie JSON is shared across all TgsPlayer
// instances pointing at the same URL, so 30 picker cells only fetch+decompress once.
const tgsCache = new Map<string, Promise<object>>();

async function decompressTgs(url: string): Promise<object> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sticker: ${res.status}`);
  const buf = await res.arrayBuffer();

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(new Uint8Array(buf));
  writer.close();

  const decompressed = await new Response(ds.readable).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(decompressed));
}

function loadTgs(url: string): Promise<object> {
  if (!tgsCache.has(url)) {
    tgsCache.set(url, decompressTgs(url));
  }
  return tgsCache.get(url)!;
}

type TgsPlayerProps = {
  src: string;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
};

export function TgsPlayer({
  src,
  size = 64,
  loop = true,
  autoplay = true,
  className,
}: TgsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    loadTgs(src)
      .then((animationData) => {
        if (cancelled || !containerRef.current) return;
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          animationData,
        });
      })
      .catch((err) => console.error('[TgsPlayer]', err));

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [src, loop, autoplay]);

  return <div ref={containerRef} style={{ width: size, height: size }} className={className} />;
}
