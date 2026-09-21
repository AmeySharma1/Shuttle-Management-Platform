'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/** Styled input with CSS variables for light & dark mode compatibility. */
const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full px-3.5 py-2.5 rounded-xl text-sm font-normal',
        'bg-[var(--input-bg)] text-[var(--foreground-heading)] border border-[var(--input-border)]',
        'placeholder:text-[var(--foreground-muted)]',
        'hover:border-[var(--input-border-hover)] focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]',
        'transition-all duration-200 outline-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
});

export default Input;
