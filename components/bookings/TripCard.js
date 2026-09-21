'use client';

import { CarFront, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatTime12h } from '@/lib/utils';

/** Card showing one commuter trip and its available actions. */
export default function TripCard({ booking, driver, canEditTrip, canCancelTrip, editReason, cancelReason, onEdit, onCancel }) {
  return <Card className="flex flex-col gap-4">
    <div className="flex items-center justify-between gap-3"><StatusBadge status={booking.status} /><span className="text-xs text-[var(--foreground-muted)]">{formatDate(booking.date)} · {formatTime12h(booking.time)}</span></div>
    <div><h3 className="text-base font-semibold text-[var(--foreground-heading)]">{booking.fromStopName} to {booking.toStopName}</h3><p className="mt-1 text-sm text-[var(--foreground-muted)]">{booking.passengers} {booking.passengers === 1 ? 'passenger' : 'passengers'}</p></div>
    <div className="flex items-start gap-3 border-t border-[var(--divider)] pt-3"><CarFront className="mt-0.5 h-4 w-4 text-[var(--icon-color)]" /><div className="min-w-0 text-sm">{driver ? <><p className="font-medium text-[var(--foreground-heading)]">{driver.name}</p><p className="text-xs text-[var(--foreground-muted)]"><Phone className="mr-1 inline h-3 w-3" />{driver.phone} · {driver.vehicle.plate}</p></> : <p className="text-[var(--foreground-muted)]">Driver not assigned yet</p>}</div></div>
    <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row"><Button variant="secondary" size="sm" onClick={onEdit} disabled={!canEditTrip} title={editReason || 'Edit trip'} className="flex-1">Edit</Button><Button variant="danger" size="sm" onClick={onCancel} disabled={!canCancelTrip} title={cancelReason || 'Cancel trip'} className="flex-1">Cancel trip</Button></div>
    {(!canEditTrip || !canCancelTrip) && <p className="text-[11px] text-[var(--foreground-muted)]">{!canEditTrip ? editReason : cancelReason}</p>}
  </Card>;
}