'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BuilderDrawerProps {
  id: string;
  title: string;
  open: boolean;
  side: 'left' | 'right';
  onClose: () => void;
  children: ReactNode;
}

/**
 * Mobile sheet for the Component Library or Property Inspector.
 * Stays mounted while closed so in-progress library drags are not cancelled.
 * Hidden from lg and up; desktop columns are unchanged.
 */
export default function BuilderDrawer({
  id,
  title,
  open,
  side,
  onClose,
  children,
}: BuilderDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'lg:hidden fixed inset-x-0 top-14 bottom-7 z-30 flex',
        !open && 'pointer-events-none'
      )}
    >
      {open && (
        <button
          type="button"
          className="absolute inset-0 bg-zinc-900/40"
          aria-label="Close panel"
          onClick={onClose}
        />
      )}
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal={open}
        aria-labelledby={`${id}-title`}
        aria-hidden={!open}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex flex-col bg-white shadow-xl outline-none',
          'w-[min(20rem,calc(100vw-1.5rem))] max-w-full h-full',
          'transition-transform duration-200 ease-out',
          'pb-[env(safe-area-inset-bottom)]',
          side === 'left' ? 'mr-auto' : 'ml-auto',
          open
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 shrink-0">
          <h2 id={`${id}-title`} className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="h-8 w-8 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
