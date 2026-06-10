'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface UseDialogOptions {
  /** Wired to the Escape key. Omit for overlays that must be resolved by a game action. */
  onClose?: () => void;
  /** Accessible name for the dialog surface. */
  label?: string;
  /**
   * `true` (default) marks the surface `aria-modal` and traps Tab focus inside it.
   * Set `false` for panels that intentionally drive interaction outside themselves
   * (e.g. the trade builder, which needs board-tile clicks).
   */
  modal?: boolean;
}

export interface DialogProps<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  role: 'dialog';
  'aria-modal': boolean;
  'aria-label': string | undefined;
  tabIndex: -1;
}

/**
 * Accessibility wiring for an overlay surface: spread the returned props onto the root element.
 *
 * On mount it moves focus into the dialog (first focusable, else the container) and, while open,
 * keeps Tab focus inside it (when `modal`). Escape calls `onClose` if provided. On unmount it
 * restores focus to whatever was focused before the dialog opened.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(
  options: UseDialogOptions = {},
): DialogProps<T> {
  const { label, modal = true } = options;
  const ref = useRef<T>(null);

  // Keep the latest onClose without re-running the focus effect (which would steal focus
  // back to the top of the dialog on every parent render).
  const onCloseRef = useRef(options.onClose);

  useEffect(() => {
    onCloseRef.current = options.onClose;
  }, [options.onClose]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables[0] ?? node).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (onCloseRef.current) {
          event.stopPropagation();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== 'Tab' || !modal) return;

      const items = node!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) {
        event.preventDefault(); // nothing to focus → keep focus on the dialog
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [modal]);

  return {
    ref,
    role: 'dialog',
    'aria-modal': modal,
    'aria-label': label,
    tabIndex: -1,
  };
}
