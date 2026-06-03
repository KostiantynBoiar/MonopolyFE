'use client';

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
        backgroundColor: 'rgba(8,10,22,0.62)',
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
      style={{ borderRadius: 'inherit', backgroundColor: 'rgba(0,0,0,0.55)' }}
    />
  );
}
