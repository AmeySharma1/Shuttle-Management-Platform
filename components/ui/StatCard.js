import { isValidElement } from 'react';
import { cn } from '@/lib/utils';

/** StatCard — Metric card with CSS variable tokens for high contrast in light & dark modes. */
export default function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-[var(--icon-bg)]',
  iconColor = 'text-[var(--icon-color)]',
  trend,
  className,
}) {
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon;
      return <IconComp className="h-5 w-5" />;
    }
    return icon;
  };

  const trendLabel = typeof trend === 'object' && trend !== null ? trend.label : trend;

  return (
    <div className={cn('saas-card p-5 flex items-start gap-4 transition-all duration-200', className)}>
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--icon-border)]', iconBg)}>
        <span className={iconColor}>{renderIcon()}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--foreground-muted)] truncate">{label}</p>
        <div className="flex flex-wrap items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">{value}</p>
          {trendLabel && (
            <span className="text-xs font-medium text-[var(--foreground-muted)]">
              {trendLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
