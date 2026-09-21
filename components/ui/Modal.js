'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Modal — Centered dialog with CSS variable tokens for light & dark themes. */
export default function Modal({ open, onClose, title, size = 'md', className, children }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Close on Escape
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

  // Focus trap
  useEffect(() => {
    if (open && contentRef.current) {
      const focusable = contentRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-enter"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          'relative w-full saas-card bg-[var(--surface-card)] border border-[var(--card-border)] rounded-2xl scale-in shadow-2xl',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)]">
            <h2 className="text-base font-semibold text-[var(--foreground-heading)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground-heading)] hover:bg-[var(--ghost-hover-bg)] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
