'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bus, Clock3, MapPinned, Sparkles, Users } from 'lucide-react';
import BookingSummary from '@/components/bookings/BookingSummary';
import TripForm from '@/components/bookings/TripForm';
import { useRole } from '@/components/layout/RoleProvider';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import { useAsyncData } from '@/hooks';
import { createBooking } from '@/services/bookingService';
import { getDriverById } from '@/services/driverService';
import { getStops } from '@/services/routeService';
import { getStopName } from '@/lib/utils';

/** Commuter booking page. */
export default function BookPage() {
	const { user } = useRole();
	const { data: stops, loading: stopsLoading, error: stopsError, reload: reloadStops } = useAsyncData(() => getStops(), []);
	const [booking, setBooking] = useState(null);
	const [driver, setDriver] = useState(null);
	const [isSaving, setIsSaving] = useState(false);

	const saveBooking = async (values) => {
		setIsSaving(true);
		try {
			const savedBooking = await createBooking({ ...values, riderId: user.id, riderName: user.name, riderPhone: '' });
			let assignedDriver = null;
			if (savedBooking.driverId) {
				try { assignedDriver = await getDriverById(savedBooking.driverId, savedBooking.date); } catch { assignedDriver = null; }
			}
			setDriver(assignedDriver);
			setBooking(savedBooking);
			toast.success('Your ride was booked successfully.');
		} catch (error) {
			toast.error(error.message || 'We could not book your ride. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	if (booking && stops) return <BookingSummary booking={booking} driver={driver} fromStopName={getStopName(stops, booking.fromStopId)} toStopName={getStopName(stops, booking.toStopId)} onBookAnother={() => { setBooking(null); setDriver(null); }} />;
	if (stopsLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" variant="text" /><CardSkeleton /></div>;
	if (stopsError) return <Card><EmptyState icon={Bus} title="Stops are unavailable" message="We could not load the campus stops right now." action={<button type="button" onClick={() => reloadStops().catch(() => {})} className="rounded-xl bg-[var(--btn-primary-bg)] px-5 py-2 text-sm font-medium text-[var(--btn-primary-text)]">Retry</button>} /></Card>;

	return <section className="mx-auto max-w-5xl space-y-8"><div className="page-intro"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-blue)]"><Sparkles className="h-3.5 w-3.5" /> Plan your next campus trip</div><h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground-heading)]">Book a ride</h2><p className="mt-2 max-w-xl text-sm text-[var(--foreground-muted)]">Choose your stops, travel time, and number of passengers. Your booking will appear in My trips and in the admin operations view.</p></div><div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch"><Card className="relative hidden overflow-hidden bg-[var(--surface-nested)] lg:flex lg:flex-col lg:justify-between"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--icon-border)] bg-[var(--icon-bg)] text-[var(--icon-color)]"><Bus className="h-6 w-6" /></div><h3 className="mt-7 text-xl font-semibold text-[var(--foreground-heading)]">A smoother campus day</h3><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Plan ahead, keep your place, and let the shuttle network handle the rest.</p></div><div className="mt-10 space-y-3 border-t border-[var(--divider)] pt-5"><div className="flex items-center gap-3 text-sm text-[var(--foreground)]"><MapPinned className="h-4 w-4 text-[var(--icon-color)]" /> Eight connected campus stops</div><div className="flex items-center gap-3 text-sm text-[var(--foreground)]"><Clock3 className="h-4 w-4 text-[var(--icon-color)]" /> Choose a time that suits you</div><div className="flex items-center gap-3 text-sm text-[var(--foreground)]"><Users className="h-4 w-4 text-[var(--icon-color)]" /> Bring up to four passengers</div></div></Card><Card className="p-5 sm:p-7"><TripForm stops={stops || []} onSubmit={saveBooking} loading={isSaving} /></Card></div></section>;
}
