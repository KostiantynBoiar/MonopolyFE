'use client';

import { useEffect, useState } from 'react';
import { BOARD_TILE_COLORS, GAME_BOARD_COLORS } from '@/features/game-board/game-board.colors';
import { TgsPlayer } from '@/shared/ui/TgsPlayer';
import type { StickerPack } from '../chat.types';
import { PANEL_BORDER_STYLE } from '../chat.constants';
import { isTgsSticker } from '../chat.utils';

const C = GAME_BOARD_COLORS;
const T = BOARD_TILE_COLORS;

function getActiveStyle(isActive: boolean) {
  return {
    backgroundColor: isActive ? T.propertyBlue : C.surface,
    color: isActive ? T.altText : C.text,
  };
}

function StickerFallback({ size, label = 'TGS' }: { size: number; label?: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[8px] border text-[11px] font-black uppercase tracking-[0.12em]"
      style={{
        width: size,
        height: size,
        backgroundColor: C.panel,
        borderColor: C.border,
        color: C.muted,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

export function StickerPreview({
  url,
  alt,
  size,
  loop = true,
  autoplay = true,
}: {
  url: string;
  alt: string;
  size: number;
  loop?: boolean;
  autoplay?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (isTgsSticker(url)) {
    return (
      <TgsPlayer
        src={url}
        size={size}
        loop={loop}
        autoplay={autoplay}
        fallback={<StickerFallback size={size} />}
      />
    );
  }

  if (failed) {
    return <StickerFallback size={size} label="IMG" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote sticker URL with onError fallback; next/image doesn't fit
    <img
      src={url}
      alt={alt}
      className="max-w-full object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

function StickerCell({
  file,
  index,
  onSelect,
  packId,
}: {
  file: string;
  index: number;
  onSelect: (url: string) => void;
  packId: string;
}) {
  const url = `/stickers/${packId}/${file}`;
  const isTgs = isTgsSticker(file);
  const [mounted, setMounted] = useState(!isTgs);

  useEffect(() => {
    if (!isTgs) return;

    const mount = () => setMounted(true);
    let idleId: number | null = null;
    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(mount, { timeout: 300 });
        return;
      }

      mount();
    }, index * 30);

    return () => {
      window.clearTimeout(timer);
      if (idleId != null) window.cancelIdleCallback(idleId);
    };
  }, [index, isTgs]);

  return (
    <button
      type="button"
      onClick={() => onSelect(url)}
      className="flex w-full aspect-square items-center justify-center rounded-[10px] border transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
      style={PANEL_BORDER_STYLE}
    >
      {isTgs && !mounted
        ? <StickerFallback size={44} />
        : <StickerPreview url={url} alt={file} size={44} loop={false} autoplay={false} />}
    </button>
  );
}

export function StickerPicker({
  packs,
  packIndex,
  onPackChange,
  onSelectSticker,
}: {
  packs: StickerPack[];
  packIndex: number;
  onPackChange: (index: number) => void;
  onSelectSticker: (url: string) => void;
}) {
  const activePack = packs[packIndex];

  return (
    <div
      className="absolute inset-x-0 bottom-[54px] top-0 z-30 flex flex-col rounded-[14px] border"
      style={{
        boxShadow: '0 8px 24px rgba(51,48,43,0.18)',
        ...PANEL_BORDER_STYLE,
      }}
    >
      {packs.length > 1 && (
        <div className="flex shrink-0 gap-[4px] border-b p-2" style={{ borderColor: C.border }}>
          {packs.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onPackChange(index)}
              className="rounded-full border px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors"
              style={{ ...getActiveStyle(index === packIndex), borderColor: C.border }}
            >
              {pack.name}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 gap-[2px] p-1.5">
          {activePack?.stickers.map((file, index) => (
            <StickerCell
              key={`${activePack.id}-${file}`}
              packId={activePack.id}
              file={file}
              index={index}
              onSelect={onSelectSticker}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
