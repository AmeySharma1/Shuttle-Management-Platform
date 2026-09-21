'use client';

// Note: This design system & component preview page is temporary and will be replaced in subsequent steps.

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Bus,
  MapPin,
  Clock,
  ShieldAlert,
  RefreshCw,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

import Hero from '@/components/layout/Hero';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';

import { BOOKING_STATUS, DUTY_STATUS } from '@/lib/constants';
import { resetAllData } from '@/lib/storage';
import { getBookings, cancelBooking } from '@/services/bookingService';
import { getDrivers } from '@/services/driverService';
import { getRoutes, getStops } from '@/services/routeService';
import { useAsyncData } from '@/hooks';

/** Temporary component preview and testing page. */
export default function PreviewPage() {
  // Modal, Drawer, and Dialog open states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Active tab selection
  const [selectedTab, setSelectedTab] = useState('upcoming');

  // Loading states for actions
  const [isSimulatingButton, setIsSimulatingButton] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);

  // Form input demo values
  const [pickupStop, setPickupStop] = useState('s1');
  const [dropStop, setDropStop] = useState('s2');
  const [riderName, setRiderName] = useState('Aarav Mehta');
  const [passengerCount, setPassengerCount] = useState(2);

  // Load real service data with async delay
  const { data: bookingsData, loading: isLoadingBookings, reload: reloadBookings } = useAsyncData(
    () => getBookings({ pageSize: 6 }),
    []
  );

  const { data: driversData, loading: isLoadingDrivers, reload: reloadDrivers } = useAsyncData(
    () => getDrivers(),
    []
  );

  const { data: routesData } = useAsyncData(() => getRoutes(), []);
  const { data: stopsData } = useAsyncData(() => getStops(), []);

  // Compute driver duty stats from the driver data source
  const onDutyDriversCount = driversData
    ? driversData.filter((d) => d.status === DUTY_STATUS.ON_DUTY).length
    : 0;
  const onBreakDriversCount = driversData
    ? driversData.filter((d) => d.status === DUTY_STATUS.ON_BREAK).length
    : 0;
  const driverDutyHint = `${onDutyDriversCount} on duty${onBreakDriversCount > 0 ? `, ${onBreakDriversCount} break` : ''}`;

  // Try a blocked action: attempt to cancel an already Completed booking
  const handleTryBlockedAction = async () => {
    setIsCancellingBooking(true);
    try {
      const completedBooking = bookingsData?.items?.find(
        (b) => b.status === BOOKING_STATUS.COMPLETED
      ) || { id: 'BK-1001' };

      await cancelBooking(completedBooking.id);
      toast.success(`Booking ${completedBooking.id} cancelled successfully.`);
    } catch (err) {
      toast.error(err.message || 'Action cannot be completed.', {
        description: err.code ? `Code: ${err.code}` : undefined,
      });
    } finally {
      setIsCancellingBooking(false);
    }
  };

  // Reset all modified data back to initial seed
  const handleResetData = async () => {
    setIsResettingData(true);
    try {
      resetAllData();
      await new Promise((resolve) => setTimeout(resolve, 300));
      reloadBookings();
      reloadDrivers();
      toast.success('Data reset to default values.');
    } catch (err) {
      toast.error('Failed to reset data: ' + err.message);
    } finally {
      setIsResettingData(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 text-[var(--foreground)]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--icon-bg)] border border-[var(--icon-border)] text-[var(--icon-color)]">
              <Bus className="h-4 w-4 font-bold" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-[var(--foreground-heading)]">
                CampusRide
              </span>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Shuttle Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              loading={isResettingData}
              onClick={handleResetData}
            >
              Reset data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-10 px-4 pt-6 sm:px-6">
        {/* Hero Section */}
        <Hero
          onGetStarted={() => {
            const bookingsSection = document.getElementById('bookings-section');
            bookingsSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Dashboard Stats */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Today's Bookings"
              value={bookingsData?.total ?? 0}
              icon={<Bus className="h-5 w-5" />}
            />
            <StatCard
              label="Active Drivers"
              value={onDutyDriversCount}
              icon={<UserCheck className="h-5 w-5" />}
              trend={driverDutyHint}
            />
            <StatCard
              label="Campus Routes"
              value={routesData?.length ?? 0}
              icon={<MapPin className="h-5 w-5" />}
            />
            <StatCard
              label="Campus Stops"
              value={stopsData?.length ?? 0}
              icon={<Clock className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* Bookings Section */}
        <section id="bookings-section" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
                Bookings
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Real-time ride requests and campus trip activity
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="danger"
                size="sm"
                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                loading={isCancellingBooking}
                onClick={handleTryBlockedAction}
              >
                Cancel booking
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => reloadBookings()}
              >
                Refresh
              </Button>
            </div>
          </div>

          {isLoadingBookings ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bookingsData?.items?.map((booking) => (
                <Card key={booking.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[var(--foreground-muted)]">
                      {booking.id}
                    </span>
                    <StatusBadge status={booking.status} type="booking" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground-heading)]">
                      {booking.riderName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--foreground)] font-medium">
                      <span>{booking.fromStopName || booking.fromStopId}</span>
                      <ArrowRight className="h-3 w-3 text-[var(--accent-blue)] shrink-0" />
                      <span>{booking.toStopName || booking.toStopId}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--divider)] pt-2.5 text-xs text-[var(--foreground-muted)]">
                    <span>{booking.date}</span>
                    <span>{booking.time} • {booking.passengers} pax</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
            Buttons
          </h2>
          <Card className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Variants
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary action</Button>
                <Button variant="secondary">Secondary outline</Button>
                <Button variant="ghost">Ghost button</Button>
                <Button variant="danger">Danger action</Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Sizes & States
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button
                  variant="secondary"
                  loading={isSimulatingButton}
                  onClick={() => {
                    setIsSimulatingButton(true);
                    setTimeout(() => setIsSimulatingButton(false), 1200);
                  }}
                >
                  {isSimulatingButton ? 'Processing...' : 'Test loading state'}
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
            Badges
          </h2>
          <Card className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Booking Status
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(BOOKING_STATUS).map((status) => (
                  <StatusBadge key={status} status={status} type="booking" />
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--divider)] pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                Driver Duty
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(DUTY_STATUS).map((status) => (
                  <StatusBadge key={status} status={status} type="duty" />
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Forms Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
            Forms
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <h3 className="font-semibold text-[var(--foreground-heading)]">Book a Ride</h3>
              <Field label="Pickup Stop" required>
                <Select
                  value={pickupStop}
                  onChange={(e) => setPickupStop(e.target.value)}
                >
                  {stopsData?.map((stop) => (
                    <option key={stop.id} value={stop.id} className="bg-[var(--input-bg)] text-[var(--foreground-heading)]">
                      {stop.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Destination Stop" required>
                <Select
                  value={dropStop}
                  onChange={(e) => setDropStop(e.target.value)}
                >
                  {stopsData?.map((stop) => (
                    <option key={stop.id} value={stop.id} className="bg-[var(--input-bg)] text-[var(--foreground-heading)]">
                      {stop.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </Card>

            <Card className="space-y-4">
              <h3 className="font-semibold text-[var(--foreground-heading)]">Rider Details</h3>
              <Field label="Rider Name" required>
                <Input
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="Enter full name"
                />
              </Field>

              <Field label="Passenger Count" required>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                />
              </Field>
            </Card>
          </div>
        </section>

        {/* Popups & Dialogs Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
            Popups
          </h2>
          <Card className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
              Open drawer
            </Button>
            <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
              Open confirm dialog
            </Button>
          </Card>
        </section>

        {/* Tabs Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
            Tabs
          </h2>
          <Card className="space-y-4">
            <Tabs
              tabs={[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ]}
              activeTab={selectedTab}
              onChange={setSelectedTab}
            />
            <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface-nested)] p-5 text-center text-sm text-[var(--foreground-muted)]">
              Active tab view: <span className="font-semibold text-[var(--foreground-heading)]">{selectedTab}</span>
            </div>
          </Card>
        </section>

        {/* Empty States Section */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground-heading)]">
            Empty State
          </h2>
          <Card>
            <EmptyState
              title="No upcoming bookings"
              message="You have no rides scheduled for today. Book a ride to travel between campus stops."
              action={
                <Button size="md" variant="primary" icon={<Bus className="h-4 w-4" />}>
                  Book a ride
                </Button>
              }
            />
          </Card>
        </section>
      </main>

      {/* Modal Dialog */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Shuttle Stop Information"
      >
        <div className="space-y-4 text-sm text-[var(--foreground)]">
          <p>
            Campus shuttles arrive every 15-20 minutes at designated campus stops.
          </p>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-nested)] p-4">
            <p className="font-medium text-[var(--foreground-heading)]">Route 1: Main Campus Loop</p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Main Gate → Library → Data Centre → Parking
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>

      {/* Slide-in Drawer */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Driver Schedules"
      >
        <div className="space-y-4 text-sm text-[var(--foreground)]">
          <p className="text-xs text-[var(--foreground-muted)]">
            Active driver roster for campus operations:
          </p>

          <div className="space-y-2.5">
            {isLoadingDrivers ? (
              <CardSkeleton />
            ) : (
              driversData?.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--surface-nested)] p-3.5"
                >
                  <div>
                    <p className="font-semibold text-[var(--foreground-heading)]">{driver.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {driver.vehicle.model} • {driver.vehicle.plate}
                    </p>
                  </div>
                  <StatusBadge status={driver.status} type="duty" />
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setIsConfirmOpen(false);
          toast.success('Action confirmed successfully.');
        }}
        title="Cancel shuttle booking?"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Cancel booking"
        variant="danger"
      />
    </div>
  );
}
