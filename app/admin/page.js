'use client';

import Link from 'next/link';
import { AlertTriangle, BarChart3, Bus, CheckCircle2, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAsyncData } from '@/hooks';
import { BOOKING_STATUS } from '@/lib/constants';
import { getBookings, getBookingsByHour, getStats } from '@/services/bookingService';
import { getLocalDate, formatTime12h } from '@/lib/utils';

/** Admin operations overview page. */
export default function AdminPage() {
  const today = getLocalDate();
  const { data: stats, loading: statsLoading, error: statsError, reload: reloadStats } = useAsyncData(() => getStats(today), [today]);
  const { data: hourlyBookings, loading: hourlyLoading, error: hourlyError, reload: reloadHourly } = useAsyncData(() => getBookingsByHour(today), [today]);
  const { data: attentionData, loading: attentionLoading, error: attentionError, reload: reloadAttention } = useAsyncData(() => getBookings({ status: BOOKING_STATUS.REQUESTED, date: today, pageSize: 100 }), [today]);
  const loading = statsLoading || hourlyLoading || attentionLoading;
  const error = statsError || hourlyError || attentionError;
  const retry = () => { reloadStats().catch(() => {}); reloadHourly().catch(() => {}); reloadAttention().catch(() => {}); };
  const needsAttention = (attentionData?.items || []).filter((booking) => !booking.driverId).slice(0, 5);
  if (loading) return <OverviewSkeleton />;
  if (error) return <Card><EmptyState title="Overview is unavailable" message="We could not load today's operations summary." action={<button type="button" onClick={retry} className="rounded-xl bg-[var(--btn-primary-bg)] px-5 py-2 text-sm font-medium text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]">Retry</button>} /></Card>;

  return <section className="space-y-6"><div><p className="text-sm text-[var(--foreground-muted)]">Operations workspace</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">Overview</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">A quick view of today&apos;s shuttle operations.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Today&apos;s bookings" value={stats.todayBookings} icon={<Bus className="h-5 w-5" />} /><StatCard label="Active drivers" value={stats.activeDrivers} icon={<Users className="h-5 w-5" />} /><StatCard label="Completed trips" value={stats.completedTrips} icon={<CheckCircle2 className="h-5 w-5" />} /><StatCard label="No-shows" value={stats.noShows} icon={<AlertTriangle className="h-5 w-5" />} /></div><HourlyChart data={hourlyBookings || []} /><AttentionList bookings={needsAttention} /></section>;
}
/** Loading skeleton for the overview dashboard. */
function OverviewSkeleton() { return <section className="space-y-6"><Skeleton className="h-10 w-48" variant="text" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><CardSkeleton /><CardSkeleton /></section>; }
/** Simple bookings-by-hour bar chart. */
function HourlyChart({ data }) { const maxCount = Math.max(...data.map((item) => item.count), 1); const busiest = data.reduce((best, item) => item.count > best.count ? item : best, data[0] || { hour: 6, count: 0 }); return <Card><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[var(--foreground-heading)]">Bookings by hour</h3><p className="mt-1 text-sm text-[var(--foreground-muted)]">Today&apos;s booking demand from 6 AM to 10 PM.</p></div><BarChart3 className="h-5 w-5 text-[var(--icon-color)]" /></div><div className="mt-6 overflow-x-auto"><div className="flex min-w-[680px] items-end gap-2 border-b border-[var(--divider)] px-2 pb-0 pt-5" style={{ height: 230 }}>{data.map((item) => <div key={item.hour} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-medium text-[var(--foreground-muted)]">{item.count}</span><div className={`w-full max-w-9 rounded-t-md transition-all ${item.hour === busiest.hour && item.count > 0 ? 'bg-[var(--accent-blue)]' : 'bg-[var(--icon-bg)]'}`} style={{ height: `${Math.max((item.count / maxCount) * 150, item.count ? 8 : 2)}px` }} title={`${formatHour(item.hour)}: ${item.count} bookings`} /><span className="text-[10px] text-[var(--foreground-muted)]">{formatHour(item.hour)}</span></div>)}</div></div><p className="mt-4 text-sm text-[var(--foreground-muted)]">Busiest hour: <span className="font-semibold text-[var(--foreground-heading)]">{formatHour(busiest.hour)} ({busiest.count} bookings)</span></p></Card>; }
/** Needs-attention booking list. */
function AttentionList({ bookings }) { return <Card><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[var(--foreground-heading)]">Needs attention</h3><p className="mt-1 text-sm text-[var(--foreground-muted)]">Requested bookings waiting for a driver.</p></div><AlertTriangle className="h-5 w-5 text-[var(--icon-color)]" /></div>{bookings.length === 0 ? <EmptyState title="All bookings have a driver." message="There are no unassigned requested bookings today." /> : <div className="mt-4 divide-y divide-[var(--divider)]">{bookings.map((booking) => <div key={booking.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-[var(--foreground-heading)]">{booking.riderName}</p><p className="text-xs text-[var(--foreground-muted)]">{booking.fromStopName} to {booking.toStopName} · {formatTime12h(booking.time)}</p></div><div className="flex items-center gap-3"><StatusBadge status={booking.status} /><Link href="/admin/bookings" className="text-xs font-semibold text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)]">View</Link></div></div>)}</div>}</Card>; }
function formatHour(hour) { return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? ' PM' : ' AM'}`; }
