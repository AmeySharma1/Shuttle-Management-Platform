'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Drawer — Right-side slide-in panel with CSS variable tokens for light & dark themes. */
export default function Drawer({ open, onClose, title, width = 'md', className, children }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (open && contentRef.current) {
      const focusable = contentRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
  };

  const drawer = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end overlay-enter"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Panel'}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={contentRef}
        className={cn(
          'relative w-full h-full bg-[var(--surface-card)] border-l border-[var(--card-border)] slide-in-right flex flex-col shadow-2xl',
          widthClasses[width],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--foreground-heading)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground-heading)] hover:bg-[var(--ghost-hover-bg)] transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
