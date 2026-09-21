/**
 * bookingService.js — All booking-related operations.
 *
 * Every public function is async with a 300-500ms artificial delay.
 * State lives in the storage layer (in-memory Map + localStorage).
 * Components call these functions — never the seed JSON directly.
 */

import { initStore, getAll, getById, upsert } from '@/lib/storage';
import { resolveBookingDates } from '@/lib/seed';
import { ServiceError } from '@/lib/errors';
import { BOOKING_STATUS, PAGE_SIZE, TRIP_DURATION_MIN } from '@/lib/constants';
import { isValidTransition, canCancel, canEdit, canSignIn, canMarkNoShow, getBlockedReason } from '@/lib/statusRules';
import { makeId, timeToMinutes, getLocalDate, rangesOverlap } from '@/lib/utils';
import rawBookings from '@/data/bookings.json';
import rawStops from '@/data/stops.json';

const NS = 'bookings';

/** Artificial delay to simulate network latency. */
function delay() {
  const ms = 300 + Math.random() * 200;
  return new Promise((r) => setTimeout(r, ms));
}

/** Ensure the store is initialized with seed data (idempotent). */
function ensureInit() {
  initStore(NS, resolveBookingDates(rawBookings));
}

const stopsMap = new Map(rawStops.map((s) => [s.id, s.name]));

/** Enrich a booking object with stop names */
function enrichBooking(booking) {
  if (!booking) return booking;
  return {
    ...booking,
    fromStopName: stopsMap.get(booking.fromStopId) || booking.fromStopId || '',
    toStopName: stopsMap.get(booking.toStopId) || booking.toStopId || '',
  };
}

/**
 * Get paginated, filtered, sorted bookings.
 * Filtering is O(n); sorting is O(n log n); pagination is O(1) slice.
 *
 * @param {Object} opts
 * @param {string} [opts.search] - Search by rider name or booking ID
 * @param {string} [opts.status] - Filter by status
 * @param {string} [opts.date] - Filter by date (YYYY-MM-DD)
 * @param {string} [opts.sortBy] - Field to sort by
 * @param {'asc'|'desc'} [opts.sortOrder] - Sort direction
 * @param {number} [opts.page] - 1-indexed page number
 * @param {number} [opts.pageSize] - Items per page
 * @returns {Promise<{items: Array, total: number, page: number, totalPages: number}>}
 */
export async function getBookings({
  search = '',
  status = '',
  date = '',
  sortBy = 'time',
  sortOrder = 'asc',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  await delay();
  ensureInit();

  let items = getAll(NS).map(enrichBooking);

  // Filter by search — O(n) scan
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.riderName.toLowerCase().includes(q) ||
        b.fromStopName.toLowerCase().includes(q) ||
        b.toStopName.toLowerCase().includes(q)
    );
  }

  // Filter by status — O(n)
  if (status) {
    items = items.filter((b) => b.status === status);
  }

  // Filter by date — O(n)
  if (date) {
    items = items.filter((b) => b.date === date);
  }

  // Sort — O(n log n)
  items.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'time') {
      cmp = timeToMinutes(a.time) - timeToMinutes(b.time);
    } else if (sortBy === 'date') {
      cmp = a.date.localeCompare(b.date);
    } else if (sortBy === 'riderName') {
      cmp = a.riderName.localeCompare(b.riderName);
    } else if (sortBy === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else if (sortBy === 'id') {
      cmp = a.id.localeCompare(b.id);
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    totalPages,
  };
}

/**
 * Get a single booking by ID. O(1).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getBookingById(id) {
  await delay();
  ensureInit();
  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');
  return enrichBooking(booking);
}

/**
 * Get bookings for a specific rider. O(n) filter.
 * @param {string} riderId
 * @returns {Promise<Array<Object>>}
 */
export async function getBookingsForRider(riderId) {
  await delay();
  ensureInit();
  return getAll(NS)
    .filter((b) => b.riderId === riderId)
    .map(enrichBooking);
}

/**
 * Get bookings for a specific driver on a given date. O(n) filter.
 * @param {string} driverId
 * @param {string} [date] - YYYY-MM-DD, defaults to today
 * @returns {Promise<Array<Object>>}
 */
export async function getBookingsForDriver(driverId, date) {
  await delay();
  ensureInit();
  const targetDate = date || getLocalDate();
  return getAll(NS)
    .filter((b) => b.driverId === driverId && b.date === targetDate)
    .map(enrichBooking)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

/**
 * Create a new booking with validation.
 * Auto-assigns a free driver if one exists (status → Accepted), else Requested.
 *
 * @param {Object} data
 * @param {string} data.riderId
 * @param {string} data.riderName
 * @param {string} data.riderPhone
 * @param {string} data.fromStopId
 * @param {string} data.toStopId
 * @param {string} data.date - YYYY-MM-DD
 * @param {string} data.time - HH:MM
 * @param {number} data.passengers - 1-4
 * @returns {Promise<Object>} The created booking
 */
export async function createBooking(data) {
  await delay();
  ensureInit();

  // Validate stops exist
  const stopIds = new Set(rawStops.map((s) => s.id));
  if (!stopIds.has(data.fromStopId)) throw new ServiceError('Please select a valid pickup stop.', 'INVALID_STOP');
  if (!stopIds.has(data.toStopId)) throw new ServiceError('Please select a valid drop-off stop.', 'INVALID_STOP');
  if (data.fromStopId === data.toStopId) throw new ServiceError('Pickup and drop-off stops must be different.', 'SAME_STOP');

  // Validate passengers
  if (!data.passengers || data.passengers < 1 || data.passengers > 4) {
    throw new ServiceError('Passengers must be between 1 and 4.', 'INVALID_PASSENGERS');
  }

  // Validate time not in past for today
  const today = getLocalDate();
  if (data.date === today) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    if (timeToMinutes(data.time) < currentMin) {
      throw new ServiceError("You can't book a ride in the past. Please choose a later time.", 'PAST_TIME');
    }
  }
  if (data.date < today) {
    throw new ServiceError("You can't book a ride for a past date.", 'PAST_DATE');
  }

  // Try to find a free driver — O(d * b) where d = drivers, b = bookings on that date
  const { findFreeDriver } = await import('@/services/driverService');
  const freeDriver = await findFreeDriver(data.date, data.time);

  const booking = {
    id: makeId('BK'),
    riderId: data.riderId,
    riderName: data.riderName,
    riderPhone: data.riderPhone,
    fromStopId: data.fromStopId,
    toStopId: data.toStopId,
    date: data.date,
    time: data.time,
    passengers: data.passengers,
    status: freeDriver ? BOOKING_STATUS.ACCEPTED : BOOKING_STATUS.REQUESTED,
    driverId: freeDriver?.id || null,
    dayOffset: undefined, // Not needed for runtime-created bookings
  };

  upsert(NS, booking);
  return booking;
}

/**
 * Update a booking's editable fields (time, route).
 * Only allowed for Requested/Accepted/Waiting.
 *
 * @param {string} id
 * @param {Object} updates - { fromStopId?, toStopId?, time?, date? }
 * @returns {Promise<Object>} Updated booking
 */
export async function updateBooking(id, updates) {
  await delay();
  ensureInit();

  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');

  const reason = getBlockedReason('edit', booking.status);
  if (reason) throw new ServiceError(reason, 'EDIT_BLOCKED');

  if (updates.fromStopId && updates.toStopId && updates.fromStopId === updates.toStopId) {
    throw new ServiceError('Pickup and drop-off stops must be different.', 'SAME_STOP');
  }

  const updated = {
    ...booking,
    ...(updates.fromStopId && { fromStopId: updates.fromStopId }),
    ...(updates.toStopId && { toStopId: updates.toStopId }),
    ...(updates.time && { time: updates.time }),
    ...(updates.date && { date: updates.date }),
  };

  upsert(NS, updated);
  return updated;
}

/**
 * Cancel a booking.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function cancelBooking(id) {
  await delay();
  ensureInit();

  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');

  const reason = getBlockedReason('cancel', booking.status);
  if (reason) throw new ServiceError(reason, 'CANCEL_BLOCKED');

  booking.status = BOOKING_STATUS.CANCELLED;
  upsert(NS, booking);
  return booking;
}

/**
 * Sign in a rider (marks them as boarded → On Going).
 * Only from Accepted/Waiting.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function signInRider(id) {
  await delay();
  ensureInit();

  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');

  const reason = getBlockedReason('signIn', booking.status);
  if (reason) throw new ServiceError(reason, 'SIGNIN_BLOCKED');

  booking.status = BOOKING_STATUS.ON_GOING;
  upsert(NS, booking);
  return booking;
}

/**
 * Mark a booking as No Show.
 * Only from Accepted/Waiting.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function markNoShow(id) {
  await delay();
  ensureInit();

  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');

  const reason = getBlockedReason('noShow', booking.status);
  if (reason) throw new ServiceError(reason, 'NOSHOW_BLOCKED');

  booking.status = BOOKING_STATUS.NO_SHOW;
  upsert(NS, booking);
  return booking;
}

/**
 * Start a trip (driver action). Accepted/Waiting → On Going.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function startTrip(id) {
  await delay();
  ensureInit();

  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');

  const reason = getBlockedReason('startTrip', booking.status);
  if (reason) throw new ServiceError(reason, 'START_BLOCKED');

  booking.status = BOOKING_STATUS.ON_GOING;
  upsert(NS, booking);
  return booking;
}

/**
 * Complete a trip (driver action). On Going → Completed.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function completeTrip(id) {
  await delay();
  ensureInit();

  const booking = getById(NS, id);
  if (!booking) throw new ServiceError(`Booking ${id} not found.`, 'NOT_FOUND');

  const reason = getBlockedReason('completeTrip', booking.status);
  if (reason) throw new ServiceError(reason, 'COMPLETE_BLOCKED');

  booking.status = BOOKING_STATUS.COMPLETED;
  upsert(NS, booking);
  return booking;
}

/**
 * Get dashboard stats for today.
 * O(n) — single pass over all bookings + driver duty lookup.
 * @returns {Promise<{todayBookings: number, activeDrivers: number, onBreakDrivers: number, activeDriversHint: string, completedTrips: number, noShows: number}>}
 */
export async function getStats() {
  await delay();
  ensureInit();

  const today = getLocalDate();
  const all = getAll(NS);

  let todayBookings = 0;
  let completedTrips = 0;
  let noShows = 0;

  // O(n) — single pass
  for (const b of all) {
    if (b.date === today) {
      todayBookings++;
      if (b.status === BOOKING_STATUS.COMPLETED) completedTrips++;
      if (b.status === BOOKING_STATUS.NO_SHOW) noShows++;
    }
  }

  // Active and on-break drivers from driver data
  const { getDrivers } = await import('@/services/driverService');
  const drivers = await getDrivers();
  const onDutyDrivers = drivers.filter((d) => d.status === 'on-duty').length;
  const onBreakDrivers = drivers.filter((d) => d.status === 'on-break').length;
  const activeDriversHint = `${onDutyDrivers} on duty${onBreakDrivers > 0 ? `, ${onBreakDrivers} on break` : ''}`;

  return {
    todayBookings,
    activeDrivers: onDutyDrivers,
    onBreakDrivers,
    activeDriversHint,
    completedTrips,
    noShows,
  };
}

/**
 * Get booking counts by hour for today (for the demand chart).
 * Returns an array of { hour, count } objects for hours 6-22.
 * O(n) — single pass over today's bookings.
 * @returns {Promise<Array<{hour: number, count: number}>>}
 */
export async function getBookingsByHour() {
  await delay();
  ensureInit();

  const today = getLocalDate();
  const all = getAll(NS);

  // Initialize hour buckets — O(1)
  const hourMap = {};
  for (let h = 6; h <= 22; h++) hourMap[h] = 0;

  // Count bookings per hour — O(n)
  for (const b of all) {
    if (b.date === today) {
      const hour = Math.floor(timeToMinutes(b.time) / 60);
      if (hourMap[hour] !== undefined) hourMap[hour]++;
    }
  }

  return Object.entries(hourMap).map(([hour, count]) => ({
    hour: Number(hour),
    count,
  }));
}
