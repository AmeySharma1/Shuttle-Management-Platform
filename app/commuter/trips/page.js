 'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import TripCard from '@/components/bookings/TripCard';
import TripForm from '@/components/bookings/TripForm';
import { useRole } from '@/components/layout/RoleProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import Tabs from '@/components/ui/Tabs';
import { useAsyncData } from '@/hooks';
import { BOOKING_STATUS } from '@/lib/constants';
import { canCancel, canEdit, getBlockedReason } from '@/lib/statusRules';
import { cancelBooking, getBookingsForRider, updateBooking } from '@/services/bookingService';
import { getDrivers } from '@/services/driverService';
import { getStops } from '@/services/routeService';
import { getLocalDate } from '@/lib/utils';

const upcomingStatuses = [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.WAITING, BOOKING_STATUS.ON_GOING];
const pastStatuses = [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW, BOOKING_STATUS.DECLINED];

/** Commuter trip history and trip actions page. */
export default function TripsPage() {
	const { user } = useRole();
	const { data: bookings, loading: bookingsLoading, error: bookingsError, reload: reloadBookings } = useAsyncData(() => getBookingsForRider(user.id), [user.id]);
	const { data: drivers, loading: driversLoading, error: driversError, reload: reloadDrivers } = useAsyncData(() => getDrivers(), []);
	const { data: stops, loading: stopsLoading, error: stopsError, reload: reloadStops } = useAsyncData(() => getStops(), []);
	const [activeTab, setActiveTab] = useState('upcoming');
	const [tripToCancel, setTripToCancel] = useState(null);
	const [tripToEdit, setTripToEdit] = useState(null);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	const refreshTrips = () => { reloadBookings().catch(() => {}); reloadDrivers().catch(() => {}); reloadStops().catch(() => {}); };
	const isLoading = bookingsLoading || driversLoading || stopsLoading;
	const error = bookingsError || driversError || stopsError;
	const today = getLocalDate();
	const upcoming = (bookings || []).filter((booking) => upcomingStatuses.includes(booking.status) && booking.date >= today).sort(sortSoonest);
	const past = (bookings || []).filter((booking) => pastStatuses.includes(booking.status) || booking.date < today).sort(sortNewest);
	const shownTrips = activeTab === 'upcoming' ? upcoming : past;
	const driverMap = new Map((drivers || []).map((driver) => [driver.id, driver]));

	async function confirmCancel() {
		setIsCancelling(true);
		try {
			await cancelBooking(tripToCancel.id);
			toast.success('Trip cancelled successfully.');
			setTripToCancel(null);
			refreshTrips();
		} catch (serviceError) {
			toast.error(serviceError.message || 'This trip could not be cancelled.');
		} finally {
			setIsCancelling(false);
		}
	}

	async function saveEdit(values) {
		setIsSavingEdit(true);
		try {
			await updateBooking(tripToEdit.id, values);
			toast.success('Trip updated successfully.');
			setTripToEdit(null);
			refreshTrips();
		} catch (serviceError) {
			toast.error(serviceError.message || 'This trip could not be updated.');
		} finally {
			setIsSavingEdit(false);
		}
	}

	if (isLoading) return <section className="space-y-4"><Skeleton className="h-10 w-48" variant="text" /><CardSkeleton /><CardSkeleton /></section>;
	if (error) return <Card><EmptyState icon={ClipboardList} title="Trips are unavailable" message="We could not load your trips right now." action={<Button onClick={refreshTrips}>Retry</Button>} /></Card>;

	return <section className="space-y-6"><div><p className="text-sm text-[var(--foreground-muted)]">Your shuttle activity</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">My trips</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">Review upcoming rides and your past travel.</p></div><Tabs tabs={[{ id: 'upcoming', label: `Upcoming (${upcoming.length})` }, { id: 'past', label: `Past (${past.length})` }]} activeTab={activeTab} onChange={setActiveTab} />{shownTrips.length === 0 ? <Card><EmptyState icon={ClipboardList} title={activeTab === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'} message={activeTab === 'upcoming' ? 'Book a ride to see it here.' : 'Your completed and cancelled trips will appear here.'} action={activeTab === 'upcoming' ? <Link href="/commuter/book" className="inline-flex items-center justify-center rounded-xl bg-[var(--btn-primary-bg)] px-6 py-2.5 text-base font-medium text-[var(--btn-primary-text)]">Book a ride</Link> : null} /></Card> : <div className="grid gap-4 lg:grid-cols-2">{shownTrips.map((booking) => <TripCard key={booking.id} booking={booking} driver={driverMap.get(booking.driverId)} canEditTrip={canEdit(booking.status)} canCancelTrip={canCancel(booking.status)} editReason={getBlockedReason('edit', booking.status)} cancelReason={getBlockedReason('cancel', booking.status)} onEdit={() => setTripToEdit(booking)} onCancel={() => setTripToCancel(booking)} />)}</div>}
		<ConfirmDialog open={Boolean(tripToCancel)} onClose={() => setTripToCancel(null)} onConfirm={confirmCancel} loading={isCancelling} title="Cancel this trip?" message="This can't be undone." confirmLabel="Cancel trip" />
		<Modal open={Boolean(tripToEdit)} onClose={() => !isSavingEdit && setTripToEdit(null)} title="Edit this trip"><TripForm key={tripToEdit?.id} stops={stops || []} initialValues={tripToEdit || undefined} onSubmit={saveEdit} submitLabel="Save changes" loading={isSavingEdit} showPassengers={false} /></Modal>
	</section>;
}

function sortSoonest(first, second) { return `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`); }
function sortNewest(first, second) { return `${second.date} ${second.time}`.localeCompare(`${first.date} ${first.time}`); }
