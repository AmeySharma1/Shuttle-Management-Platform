'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/** Styled select dropdown with CSS variables for light & dark mode compatibility. */
const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl text-sm font-normal',
          'bg-[var(--input-bg)] text-[var(--foreground-heading)] border border-[var(--input-border)]',
          'hover:border-[var(--input-border-hover)] focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--focus-ring)]',
          'transition-all duration-200 outline-none cursor-pointer',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
    </div>
  );
});

export default Select;
