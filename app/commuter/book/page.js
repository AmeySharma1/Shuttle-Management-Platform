'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bus } from 'lucide-react';
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

	return <section className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm text-[var(--foreground-muted)]">Plan your next campus trip</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">Book a ride</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">Choose your stops, travel time, and number of passengers.</p></div><Card><TripForm stops={stops || []} onSubmit={saveBooking} loading={isSaving} /></Card></section>;
}
