'use client';

import { useState } from 'react';
import { SettingsButton } from './SettingsButton';
import { SettingsDrawer } from './SettingsDrawer';

export function SettingsControl({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SettingsButton onClick={() => setOpen(true)} className={className} />
      {open && <SettingsDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
