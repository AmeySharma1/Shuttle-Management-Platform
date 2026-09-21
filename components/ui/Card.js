import { cn } from '@/lib/utils';

/** Card container with 16px radius, #0B1020 background, subtle border, and clean spacing. */
export default function Card({
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        'saas-card p-5 sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
