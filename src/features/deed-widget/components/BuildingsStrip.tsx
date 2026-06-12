'use client';

import { useTranslations } from 'next-intl';
import type { BuildingState } from '../deed.types';

interface BuildingsStripProps {
  ownership: BuildingState;
  backgroundColor: string;
  className?: string;
}

export function BuildingsStrip({ ownership, backgroundColor, className = '' }: BuildingsStripProps) {
  const t = useTranslations('Deed');
  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-[10px] px-2 py-2 ${className}`}
      style={{ backgroundColor }}
    >
      {ownership.hotel ? (
        <div
          title={t('building.hotel')}
          style={{
            width: 16, height: 16,
            backgroundColor: '#8B2020',
            borderRadius: 3,
            border: '1.5px solid rgba(255,255,255,0.88)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
          }}
        />
      ) : (
        Array.from({ length: ownership.houses }).map((_, i) => (
          <div
            key={i}
            title={t('building.houseNumber', { count: i + 1 })}
            style={{
              width: 12, height: 12,
              backgroundColor: '#1A6B3A',
              borderRadius: 2,
              border: '1.5px solid rgba(255,255,255,0.88)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
            }}
          />
        ))
      )}
    </div>
  );
}
