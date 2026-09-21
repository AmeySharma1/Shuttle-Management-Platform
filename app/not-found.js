import Link from 'next/link';
import { MapPinned } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

/** Friendly fallback for unknown routes. */
export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md"><EmptyState icon={MapPinned} title="We could not find that page" message="The page may have moved or the address may be incorrect." action={<Link href="/" className="inline-flex items-center justify-center rounded-xl bg-[var(--btn-primary-bg)] px-6 py-2.5 text-base font-medium text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)]">Go home</Link>} /></Card></main>;
}
