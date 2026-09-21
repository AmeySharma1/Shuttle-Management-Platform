'use client';

import Link from 'next/link';
import { CarFront, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatTime12h } from '@/lib/utils';

/** Confirmation card shown after a commuter books a ride. */
export default function BookingSummary({ booking, driver, fromStopName, toStopName, onBookAnother }) {
  return <Card className="mx-auto max-w-2xl space-y-6 border-[var(--accent-blue)]/30">
    <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" /><div><h2 className="text-xl font-bold text-[var(--foreground-heading)]">Your ride is booked</h2><p className="mt-1 text-sm text-[var(--foreground-muted)]">Keep this confirmation for your trip.</p></div></div>
    <div className="grid gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--surface-nested)] p-4 sm:grid-cols-2">
      <div><p className="text-xs text-[var(--foreground-muted)]">Booking ID</p><p className="mt-1 font-semibold text-[var(--foreground-heading)]">{booking.id}</p></div>
      <div><p className="text-xs text-[var(--foreground-muted)]">Status</p><div className="mt-1"><StatusBadge status={booking.status} /></div></div>
      <div><p className="text-xs text-[var(--foreground-muted)]">Route</p><p className="mt-1 font-medium text-[var(--foreground-heading)]">{fromStopName} to {toStopName}</p></div>
      <div><p className="text-xs text-[var(--foreground-muted)]">When</p><p className="mt-1 font-medium text-[var(--foreground-heading)]">{formatDate(booking.date)} at {formatTime12h(booking.time)}</p></div>
    </div>
    <div className="flex items-start gap-3 border-t border-[var(--divider)] pt-4"><CarFront className="mt-0.5 h-5 w-5 text-[var(--icon-color)]" /><div><p className="font-semibold text-[var(--foreground-heading)]">{driver ? driver.name : 'Driver'}</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">{driver ? `${driver.vehicle.model} · ${driver.vehicle.plate}` : 'We are finding a driver for you'}</p></div></div>
    <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={onBookAnother} className="flex-1">Book another ride</Button><Button variant="secondary" className="flex-1"><Link href="/commuter/trips" className="w-full">View my trips</Link></Button></div>
  </Card>;
}