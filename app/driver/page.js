'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CarFront, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRole } from '@/components/layout/RoleProvider';
import { useAsyncData } from '@/hooks';
import { BOOKING_STATUS, DUTY_STATUS } from '@/lib/constants';
import { canCompleteTrip, canStartTrip, getBlockedReason } from '@/lib/statusRules';
import { completeTrip, getBookingsForDriver, startTrip } from '@/services/bookingService';
import { endBreak, endDuty, getDriverById, startBreak, startDuty } from '@/services/driverService';
import { formatTime12h, getLocalDate } from '@/lib/utils';

/** Driver My Day page. */
export default function DriverPage() {
  const { user } = useRole();
  const today = getLocalDate();
  const { data: driver, loading: driverLoading, error: driverError, reload: reloadDriver } = useAsyncData(() => getDriverById(user.id, today), [user.id, today]);
  const { data: trips, loading: tripsLoading, error: tripsError, reload: reloadTrips } = useAsyncData(() => getBookingsForDriver(user.id, today), [user.id, today]);
  const [actionLoading, setActionLoading] = useState(false);
  const loading = driverLoading || tripsLoading;
  const error = driverError || tripsError;

  const refresh = () => { reloadDriver().catch(() => {}); reloadTrips().catch(() => {}); };
  const runAction = async (action, message) => { setActionLoading(true); try { await action(); toast.success(message); refresh(); } catch (serviceError) { toast.error(serviceError.message || 'The action could not be completed.'); } finally { setActionLoading(false); } };
  const status = driver?.status || DUTY_STATUS.OFF_DUTY;

  if (loading) return <section className="space-y-4"><Skeleton className="h-10 w-48" variant="text" /><CardSkeleton /><CardSkeleton /></section>;
  if (error) return <Card><EmptyState title="Your day is unavailable" message="We could not load your driver information right now." action={<Button onClick={refresh}>Retry</Button>} /></Card>;
  return <section className="space-y-6"><div><p className="text-sm text-[var(--foreground-muted)]">Driver workspace</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">My day</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">Manage your duty and assigned trips for today.</p></div><Card><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--icon-bg)] text-[var(--icon-color)]"><CarFront className="h-6 w-6" /></div><div><h3 className="font-semibold text-[var(--foreground-heading)]">{driver.name}</h3><p className="text-sm text-[var(--foreground-muted)]">{driver.vehicle.model} · {driver.vehicle.plate}</p></div></div><StatusBadge status={status === DUTY_STATUS.ON_DUTY ? 'On duty' : status === DUTY_STATUS.ON_BREAK ? 'On break' : 'Off duty'} /></div><div className="mt-5 flex flex-wrap gap-2">{status === DUTY_STATUS.OFF_DUTY && <Button className="flex-1" loading={actionLoading} onClick={() => runAction(() => startDuty(user.id), 'Duty started.')}>Start duty</Button>}{status !== DUTY_STATUS.OFF_DUTY && <Button variant="secondary" className="flex-1" loading={actionLoading} onClick={() => runAction(() => endDuty(user.id), 'Duty ended.')}>End duty</Button>}{status === DUTY_STATUS.ON_DUTY && <Button variant="secondary" className="flex-1" loading={actionLoading} onClick={() => runAction(() => startBreak(user.id), 'Break started.')}>Take break</Button>}{status === DUTY_STATUS.ON_BREAK && <Button variant="secondary" className="flex-1" loading={actionLoading} onClick={() => runAction(() => endBreak(user.id), 'Break ended.')}>End break</Button>}</div></Card><div className="space-y-4"><div><h3 className="text-lg font-semibold text-[var(--foreground-heading)]">Today&apos;s trips</h3><p className="text-sm text-[var(--foreground-muted)]">Your assigned rides for {today}.</p></div>{trips?.length ? <div className="grid gap-4 lg:grid-cols-2">{trips.map((trip) => <DriverTripCard key={trip.id} trip={trip} dutyStatus={status} loading={actionLoading} onStart={() => runAction(() => startTrip(trip.id), 'Trip started.')} onComplete={() => runAction(() => completeTrip(trip.id), 'Trip completed.')} />)}</div> : <Card><EmptyState icon={CarFront} title="No trips today. Enjoy your day." /></Card>}</div></section>;
}
 
/** Driver trip card with start and complete actions. */
function DriverTripCard({ trip, dutyStatus, loading, onStart, onComplete }) { const canStart = canStartTrip(trip.status) && dutyStatus !== DUTY_STATUS.OFF_DUTY; const canComplete = canCompleteTrip(trip.status) && dutyStatus !== DUTY_STATUS.OFF_DUTY; const startReason = dutyStatus === DUTY_STATUS.OFF_DUTY ? 'Start duty before starting a trip.' : getBlockedReason('startTrip', trip.status); const completeReason = dutyStatus === DUTY_STATUS.OFF_DUTY ? 'Start duty before completing a trip.' : getBlockedReason('completeTrip', trip.status); return <Card className="space-y-4"><div className="flex items-center justify-between"><div><p className="text-lg font-semibold text-[var(--foreground-heading)]">{formatTime12h(trip.time)}</p><p className="text-sm text-[var(--foreground-muted)]">{trip.riderName} · <Phone className="inline h-3 w-3" /> {trip.riderPhone}</p></div><StatusBadge status={trip.status} /></div><div><p className="font-medium text-[var(--foreground-heading)]">{trip.fromStopName} to {trip.toStopName}</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">{trip.passengers} {trip.passengers === 1 ? 'passenger' : 'passengers'}</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={!canStart || loading} title={startReason || 'Start trip'} loading={loading && canStart} onClick={onStart}>Start trip</Button><Button variant="secondary" className="flex-1" disabled={!canComplete || loading} title={completeReason || 'Complete trip'} loading={loading && canComplete} onClick={onComplete}>Complete trip</Button></div>{(!canStart || !canComplete) && <p className="text-[11px] text-[var(--foreground-muted)]">{!canStart ? startReason : completeReason}</p>}</Card>; }
