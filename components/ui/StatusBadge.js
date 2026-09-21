import { cn } from '@/lib/utils';
import { STATUS_STYLES, DUTY_STYLES } from '@/lib/constants';

/** StatusBadge — Colored pill badge with soft tinted background and crisp text. */
export default function StatusBadge({ status, type = 'booking', className }) {
  const styles = type === 'duty' ? DUTY_STYLES[status] : STATUS_STYLES[status];

  if (!styles) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-[#7E87A6] border border-white/10', className)}>
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles.bg,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {status}
    </span>
  );
}
