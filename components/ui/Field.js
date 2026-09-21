import { cn } from '@/lib/utils';

/** Form field wrapper with accessible label and inline error message. */
export default function Field({ label, error, required, htmlFor, hint, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-[var(--foreground-heading)] flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-[var(--foreground-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
