'use client';

import { TILE_SHEEN } from './constants';

// ─── TileSheen ────────────────────────────────────────────────────────────────
// Glossy top-light overlay shared by every tile flavor. Sits just above the
// surface fill (z-[1]) and below the color band / content so labels stay sharp.

export function TileSheen() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ borderRadius: 'inherit', backgroundImage: TILE_SHEEN }}
    />
  );
}

// ─── OwnershipOverlay ─────────────────────────────────────────────────────────

interface OwnershipOverlayProps {
  color:        string;
  isMortgaged:  boolean;
}

export function OwnershipOverlay({ color, isMortgaged }: OwnershipOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        borderRadius:    'inherit',
        backgroundColor: color,
        opacity:         isMortgaged ? 0.12 : 0.30,
      }}
    />
  );
}

// ─── MortgageOverlay ──────────────────────────────────────────────────────────

export function MortgageOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[46] flex items-center justify-center"
      style={{
        borderRadius:    'inherit',
        backgroundColor: 'rgba(8,10,22,0.55)',
        backdropFilter:  'blur(2px) saturate(0.6)',
        WebkitBackdropFilter: 'blur(2px) saturate(0.6)',
        boxShadow:       'inset 0 0 0 1px rgba(255,255,255,0.10)',
      }}
    >
      <span
        style={{
          fontSize:   'clamp(12px, 2.4vmin, 30px)',
          lineHeight: 1,
          filter:     'drop-shadow(0 1px 4px rgba(0,0,0,0.8))',
        }}
      >
        🔒
      </span>
    </div>
  );
}

// ─── DimOverlay ───────────────────────────────────────────────────────────────

export function DimOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[47] transition-opacity duration-300"
      style={{
        borderRadius:    'inherit',
        backgroundColor: 'rgba(16,24,46,0.50)',
        backdropFilter:  'blur(1px) saturate(0.85)',
        WebkitBackdropFilter: 'blur(1px) saturate(0.85)',
      }}
    />
  );
}
