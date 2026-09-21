import { isValidElement } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

/** EmptyState — Placeholder for zero-data views with CSS variable tokens. */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}) {
  const renderIcon = () => {
    if (!icon) return <Inbox className="w-6 h-6 text-[var(--icon-color)]" />;
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon;
      return <IconComp className="w-6 h-6 text-[var(--icon-color)]" />;
    }
    return icon;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-10 px-4 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-[var(--icon-bg)] border border-[var(--icon-border)] flex items-center justify-center mb-3">
        {renderIcon()}
      </div>
      <h3 className="text-sm font-semibold text-[var(--foreground-heading)] mb-1">{title}</h3>
      {message && <p className="text-xs text-[var(--foreground-muted)] max-w-sm leading-relaxed">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
