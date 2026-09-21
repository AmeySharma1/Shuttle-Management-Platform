'use client';

import { cn } from '@/lib/utils';

/** Tabs navigation with CSS variable tokens for light & dark themes. */
export default function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div
      className={cn('flex flex-wrap gap-1 p-1 rounded-xl bg-[var(--surface-nested)] border border-[var(--card-border)]', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 min-w-[90px] px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer select-none text-center',
              isActive
                ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-heading)] hover:bg-[var(--ghost-hover-bg)]'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
