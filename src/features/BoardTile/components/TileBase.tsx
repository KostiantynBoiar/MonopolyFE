'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { TILE_INTERACTIVE } from '../boardTile.constants';
import type { BoardTileSelectionTone } from '../boardTile.enums';
import { DimOverlay, TileSheen } from './Overlays';
import { SelectionRing } from './SelectionRing';

interface TileBaseProps {
  isSelected?:   boolean;
  selectionTone?: BoardTileSelectionTone | null;
  isDimmed?:     boolean;
  onSelect?:     () => void;
  className?:    string;
  style?:        React.CSSProperties;
  children:      ReactNode;
}

// Shared interactive wrapper for every tile flavor.
// Handles accessibility, keyboard nav, sheen, dim, and selection ring.
export function TileBase({
  isSelected   = false,
  selectionTone = null,
  isDimmed     = false,
  onSelect,
  className,
  style,
  children,
}: TileBaseProps) {
  const isSelectable = Boolean(onSelect);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  return (
    <article
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      aria-pressed={isSelectable ? isSelected : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative overflow-hidden border',
        isSelectable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        isSelectable && TILE_INTERACTIVE,
        className,
      )}
      style={style}
    >
      <TileSheen />
      {children}
      {isDimmed && <DimOverlay />}
      <SelectionRing selected={isSelected} tone={selectionTone} />
    </article>
  );
}
