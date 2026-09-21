import { cn } from '@/lib/utils';

/** Skeleton — Shimmer loading placeholder. */
export default function Skeleton({ className, variant = 'rectangle' }) {
  const variantClasses = {
    rectangle: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return (
    <div
      className={cn(
        'skeleton-shimmer',
        variantClasses[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}

/** CardSkeleton — Card placeholder loader. */
export function CardSkeleton({ className }) {
  return (
    <div className={cn('card-navy rounded-2xl md:rounded-3xl p-5 space-y-3', className)}>
      <Skeleton className="h-5 w-1/3" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
      <Skeleton className="h-4 w-1/2" variant="text" />
    </div>
  );
}

/** TableRowSkeleton — Table row placeholder loader. */
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" variant="text" />
        </td>
      ))}
    </tr>
  );
}
