import { isValidElement } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * @typedef {'primary'|'secondary'|'ghost'|'danger'} ButtonVariant
 * @typedef {'sm'|'md'|'lg'} ButtonSize
 */

const variants = {
  primary:
    'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium shadow-sm hover:shadow-[0_0_20px_var(--accent-blue-glow)] active:scale-[0.98]',
  secondary:
    'bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-hover-bg)] hover:border-[var(--btn-secondary-hover-border)] active:scale-[0.98]',
  ghost:
    'text-[var(--foreground-muted)] hover:text-[var(--foreground-heading)] hover:bg-[var(--ghost-hover-bg)] active:scale-[0.98]',
  danger:
    'bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] hover:bg-[var(--danger-hover-bg)] hover:border-[var(--danger-hover-border)] active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-2.5 text-base gap-2.5 rounded-xl',
};

/** Button component with CSS variable tokens for high contrast in light & dark modes. */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className,
  children,
  ...props
}) {
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return <span className="shrink-0">{icon}</span>;
    }
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon;
      return <IconComp className="h-4 w-4 shrink-0" />;
    }
    return <span className="shrink-0">{icon}</span>;
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)] focus-visible:outline-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        renderIcon()
      )}
      {children}
    </button>
  );
}
