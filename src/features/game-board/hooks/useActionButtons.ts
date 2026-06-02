'use client';

import { useState } from 'react';

export type OverlayId = 'manage' | 'trade' | 'jail' | 'debt' | 'auction' | 'card';

const BUTTON_OVERLAY_MAP: Partial<Record<string, OverlayId>> = {
  manage: 'manage',
  trade:  'trade',
};

export function useActionButtons() {
  const [activeOverlay, setActiveOverlay] = useState<OverlayId | null>(null);

  function handleAction(id: string) {
    const next = BUTTON_OVERLAY_MAP[id] ?? null;
    if (next) setActiveOverlay((prev) => (prev === next ? null : next));
  }

  const openOverlay  = (id: OverlayId)   => setActiveOverlay(id);
  const closeOverlay = ()                 => setActiveOverlay(null);

  return { activeOverlay, handleAction, openOverlay, closeOverlay };
}
