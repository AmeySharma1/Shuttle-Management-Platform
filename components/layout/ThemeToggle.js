'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/** ThemeToggle — Clean two-state switch between Light and Dark mode. */
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-[var(--card-border)] bg-[var(--surface-nested)]" />
    );
  }

  const currentTheme = theme === 'system' ? (resolvedTheme || 'dark') : theme;
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-nested)] text-[var(--foreground-muted)] transition-all duration-200 hover:border-[var(--card-border-hover)] hover:text-[var(--foreground-heading)] cursor-pointer"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700" />
      )}
    </button>
  );
}
