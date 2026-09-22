'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import TripForm from '@/components/bookings/TripForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Drawer from '@/components/ui/Drawer';
import EmptyState from '@/components/ui/EmptyState';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Skeleton, { TableRowSkeleton } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAsyncData, useDebounce } from '@/hooks';
import { BOOKING_STATUS } from '@/lib/constants';
import { canCancel, canEdit, canMarkNoShow, canSignIn, getBlockedReason } from '@/lib/statusRules';
import { cancelBooking, getBookingById, getBookings, markNoShow, signInRider, updateBooking } from '@/services/bookingService';
import { getDrivers } from '@/services/driverService';
import { getStops } from '@/services/routeService';
import { formatDate, formatTime12h } from '@/lib/utils';

const pageSize = 8;

/** Admin booking management page. */
export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const query = { search: debouncedSearch, status, date, page, pageSize, sortBy, sortOrder };
  const { data: result, loading, error, reload } = useAsyncData(() => getBookings(query), [debouncedSearch, status, date, page, sortBy, sortOrder]);
  const { data: stops } = useAsyncData(() => getStops(), []);
  const { data: drivers } = useAsyncData(() => getDrivers(), []);
  const driverMap = new Map((drivers || []).map((driver) => [driver.id, driver]));

  const resetFilters = () => { setSearch(''); setStatus(''); setDate(''); setPage(1); };
  const sortColumn = (column) => { if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(column); setSortOrder('asc'); } setPage(1); };
  const refreshSelected = async (id) => { const updated = await getBookingById(id); setSelectedBooking(updated); await reload(); };
  const runAction = async (action, label) => {
    setActionLoading(true);
    try { await action(); toast.success(label); if (selectedBooking) await refreshSelected(selectedBooking.id); }
    catch (serviceError) { toast.error(serviceError.message || 'The action could not be completed.'); }
    finally { setActionLoading(false); setConfirmAction(null); }
  };
  const openBooking = async (booking) => { try { setSelectedBooking(await getBookingById(booking.id)); } catch (serviceError) { toast.error(serviceError.message); } };
  const titleForSort = (label, column) => <button type="button" onClick={() => sortColumn(column)} className="inline-flex items-center gap-1 font-semibold text-[var(--foreground-heading)]">{label}{sortBy === column && (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button>;

  if (loading && !result) return <LoadingTable />;
  if (error) return <Card><EmptyState title="Bookings are unavailable" message="We could not load bookings right now." action={<Button onClick={() => reload().catch(() => {})}>Retry</Button>} /></Card>;
  return <section className="space-y-5"><div><p className="text-sm text-[var(--foreground-muted)]">Operations workspace</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">Bookings</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">Search, review and manage every commuter booking.</p></div><div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end"><Field label="Search bookings" htmlFor="booking-search"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" /><Input id="booking-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rider name or booking ID" className="pl-9" /></div></Field><Field label="Status"><Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{Object.values(BOOKING_STATUS).map((option) => <option key={option} value={option}>{option}</option>)}</Select></Field><Field label="Date"><Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} /></Field><Button variant="secondary" onClick={resetFilters}>Clear</Button></div>{result?.items?.length ? <><div className="hidden overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--surface-card)] md:block"><table className="w-full text-left text-sm"><thead className="border-b border-[var(--divider)] bg-[var(--surface-nested)]"><tr><th className="px-4 py-3">{titleForSort('Booking ID', 'id')}</th><th className="px-4 py-3">{titleForSort('Rider', 'riderName')}</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">{titleForSort('Date and time', 'date')}</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-[var(--divider)]">{result.items.map((booking) => <tr key={booking.id} onClick={() => openBooking(booking)} className="cursor-pointer hover:bg-[var(--ghost-hover-bg)]"><td className="px-4 py-3 font-mono text-xs text-[var(--foreground-muted)]">{booking.id}</td><td className="px-4 py-3 font-medium text-[var(--foreground-heading)]">{booking.riderName}</td><td className="px-4 py-3">{booking.fromStopName} to {booking.toStopName}</td><td className="px-4 py-3">{formatDate(booking.date)}<span className="block text-xs text-[var(--foreground-muted)]">{formatTime12h(booking.time)}</span></td><td className={`px-4 py-3 ${driverMap.get(booking.driverId) ? '' : 'text-[var(--foreground-muted)]'}`}>{driverMap.get(booking.driverId)?.name || 'Not assigned'}</td><td className="px-4 py-3"><StatusBadge status={booking.status} /></td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{result.items.map((booking) => <button type="button" key={booking.id} onClick={() => openBooking(booking)} className="text-left"><Card><div className="flex items-center justify-between"><span className="font-mono text-xs text-[var(--foreground-muted)]">{booking.id}</span><StatusBadge status={booking.status} /></div><p className="mt-3 font-semibold text-[var(--foreground-heading)]">{booking.riderName}</p><p className="text-sm">{booking.fromStopName} to {booking.toStopName}</p><p className="mt-2 text-xs text-[var(--foreground-muted)]">{formatDate(booking.date)} · {formatTime12h(booking.time)} · {driverMap.get(booking.driverId)?.name || 'Driver not assigned'}</p></Card></button>)}</div><Pagination result={result} page={page} setPage={setPage} /></> : <Card><EmptyState title="No bookings found" message="Try changing your search or filters." action={<Button variant="secondary" onClick={resetFilters}>Clear filters</Button>} /></Card>}
    <BookingDrawer booking={selectedBooking} driver={selectedBooking ? driverMap.get(selectedBooking.driverId) : null} onClose={() => setSelectedBooking(null)} onEdit={() => setEditingBooking(selectedBooking)} onConfirm={setConfirmAction} onAction={runAction} loading={actionLoading} />
    <ConfirmDialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={() => runAction(confirmAction === 'cancel' ? () => cancelBooking(selectedBooking.id) : () => markNoShow(selectedBooking.id), confirmAction === 'cancel' ? 'Booking cancelled.' : 'Rider marked as no-show.')} loading={actionLoading} title={confirmAction === 'cancel' ? 'Cancel this booking?' : 'Mark rider as no-show?'} message="This action changes the booking status." confirmLabel="Confirm" />
    <Modal open={Boolean(editingBooking)} onClose={() => !actionLoading && setEditingBooking(null)} title="Edit booking"><TripForm key={editingBooking?.id} stops={stops || []} initialValues={editingBooking || undefined} showPassengers={false} submitLabel="Save changes" loading={actionLoading} onSubmit={(values) => runAction(() => updateBooking(editingBooking.id, values), 'Booking updated.').then(() => setEditingBooking(null))} /></Modal>
  </section>;
}

/** Loading state for the bookings table. */
function LoadingTable() { return <div className="space-y-5"><Skeleton className="h-10 w-48" variant="text" /><Card><table className="w-full"><tbody>{Array.from({ length: 6 }, (_, index) => <TableRowSkeleton key={index} cols={6} />)}</tbody></table></Card></div>; }

/** Pagination controls for booking results. */
function Pagination({ result, page, setPage }) { return <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-[var(--foreground-muted)]">Page {result.page} of {result.totalPages} · {result.total} total bookings</p><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="secondary" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div></div>; }

/** Booking detail drawer with guarded admin actions. */
function BookingDrawer({ booking, driver, onClose, onEdit, onConfirm, onAction, loading }) {
  if (!booking) return null;
  const actionInfo = [{ label: 'Edit', allowed: canEdit(booking.status), reason: getBlockedReason('edit', booking.status), action: onEdit }, { label: 'Cancel booking', allowed: canCancel(booking.status), reason: getBlockedReason('cancel', booking.status), action: () => onConfirm('cancel') }, { label: 'Sign in rider', allowed: canSignIn(booking.status), reason: getBlockedReason('signIn', booking.status), action: () => onAction(() => signInRider(booking.id), 'Rider signed in.') }, { label: 'Mark no-show', allowed: canMarkNoShow(booking.status), reason: getBlockedReason('noShow', booking.status), action: () => onConfirm('noShow') }];
  return <Drawer open={Boolean(booking)} onClose={onClose} title={`Booking ${booking.id}`}><div className="space-y-5"><StatusBadge status={booking.status} /><InfoRow label="Rider" value={`${booking.riderName} · ${booking.riderPhone || 'Phone not available'}`} /><InfoRow label="Route" value={`${booking.fromStopName} to ${booking.toStopName}`} /><InfoRow label="When" value={`${formatDate(booking.date)} at ${formatTime12h(booking.time)}`} /><InfoRow label="Passengers" value={String(booking.passengers)} /><InfoRow label="Driver" value={driver ? `${driver.name} · ${driver.vehicle.plate}` : 'Driver not assigned'} /><div><h3 className="mb-2 text-sm font-semibold text-[var(--foreground-heading)]">History</h3><div className="space-y-2 border-l border-[var(--card-border)] pl-3 text-xs text-[var(--foreground-muted)]"><p><span className="font-medium text-[var(--foreground-heading)]">{booking.status}</span> · Current booking status</p><p>Booking created · {formatDate(booking.date)} at {formatTime12h(booking.time)}</p></div></div><div className="space-y-2 border-t border-[var(--divider)] pt-4">{actionInfo.map((item) => <div key={item.label}><Button variant={item.label.includes('Cancel') || item.label.includes('no-show') ? 'danger' : 'secondary'} className="w-full" disabled={!item.allowed || loading} loading={loading && item.allowed} onClick={item.action}>{item.label}</Button>{!item.allowed && <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">{item.reason}</p>}</div>)}</div></div></Drawer>;
}

function InfoRow({ label, value }) { return <div><p className="text-xs text-[var(--foreground-muted)]">{label}</p><p className="mt-1 text-sm font-medium text-[var(--foreground-heading)]">{value}</p></div>; }
