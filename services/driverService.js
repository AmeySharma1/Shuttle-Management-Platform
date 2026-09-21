/**
 * driverService.js — Driver management: duty status, breaks, timeline, scheduling.
 *
 * Every public function is async with a 300-500ms artificial delay.
 * State lives in the storage layer (in-memory Map + localStorage).
 */

import { initStore, getAll, getById, upsert } from '@/lib/storage';
import { resolveDriverDates } from '@/lib/seed';
import { ServiceError } from '@/lib/errors';
import { DUTY_STATUS, BOOKING_STATUS, TRIP_DURATION_MIN } from '@/lib/constants';
import { timeToMinutes, rangesOverlap, getLocalDate } from '@/lib/utils';
import rawDrivers from '@/data/drivers.json';

const NS = 'drivers';

function delay() {
  const ms = 300 + Math.random() * 200;
  return new Promise((r) => setTimeout(r, ms));
}

function ensureInit() {
  initStore(NS, resolveDriverDates(rawDrivers));
}

/**
 * Get the driver's shift for a given date.
 * @param {Object} driver
 * @param {string} date - YYYY-MM-DD
 * @returns {Object|undefined} The shift object, or undefined
 */
function getShiftForDate(driver, date) {
  return driver.shifts.find((s) => s.date === date);
}

/**
 * Enrich driver with status and active shift for target date.
 * @param {Object} driver
 * @param {string} date - YYYY-MM-DD
 * @returns {Object}
 */
function enrichDriver(driver, date) {
  const targetDate = date || getLocalDate();
  const shift = getShiftForDate(driver, targetDate);
  const status = shift ? shift.status : DUTY_STATUS.OFF_DUTY;
  return {
    ...driver,
    status,
    currentShift: shift || null,
  };
}

/**
 * Get all drivers enriched with current duty status.
 * @param {string} [date] - YYYY-MM-DD
 * @returns {Promise<Array<Object>>}
 */
export async function getDrivers(date) {
  await delay();
  ensureInit();
  const targetDate = date || getLocalDate();
  const drivers = getAll(NS);
  return drivers.map((d) => enrichDriver(d, targetDate));
}

/**
 * Get a single driver by ID. O(1).
 * @param {string} id
 * @param {string} [date]
 * @returns {Promise<Object>}
 */
export async function getDriverById(id, date) {
  await delay();
  ensureInit();
  const driver = getById(NS, id);
  if (!driver) throw new ServiceError(`Driver ${id} not found.`, 'NOT_FOUND');
  return enrichDriver(driver, date);
}

/**
 * Get duty statistics for all drivers on a given date.
 * @param {string} [date] - YYYY-MM-DD
 * @returns {Promise<{onDuty: number, onBreak: number, offDuty: number, total: number, label: string}>}
 */
export async function getDriverDutyStats(date) {
  await delay();
  ensureInit();
  const drivers = await getDrivers(date);
  const onDuty = drivers.filter((d) => d.status === DUTY_STATUS.ON_DUTY).length;
  const onBreak = drivers.filter((d) => d.status === DUTY_STATUS.ON_BREAK).length;
  const offDuty = drivers.filter((d) => d.status === DUTY_STATUS.OFF_DUTY).length;
  const label = `${onDuty} on duty${onBreak > 0 ? `, ${onBreak} on break` : ''}`;
  return { onDuty, onBreak, offDuty, total: drivers.length, label };
}

/**
 * Get timeline data for all drivers on a given date.
 * Returns drivers with their shifts and trip blocks.
 * O(d * b) where d = drivers, b = bookings for that date.
 *
 * @param {string} [date] - YYYY-MM-DD, defaults to today
 * @returns {Promise<Array<Object>>}
 */
export async function getDriverTimeline(date) {
  await delay();
  ensureInit();

  const targetDate = date || getLocalDate();
  const drivers = getAll(NS);

  // Lazy import to avoid circular dependency
  const { getAll: getAllBookings } = await import('@/lib/storage');
  const { initStore: initBookings } = await import('@/lib/storage');
  const { resolveBookingDates } = await import('@/lib/seed');
  const rawBk = (await import('@/data/bookings.json')).default;
  initBookings('bookings', resolveBookingDates(rawBk));

  const allBookings = getAllBookings('bookings');

  return drivers.map((driver) => {
    const shift = getShiftForDate(driver, targetDate);
    // O(b) filter for this driver's trips on this date
    const trips = allBookings.filter(
      (b) =>
        b.driverId === driver.id &&
        b.date === targetDate &&
        ![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED].includes(b.status)
    );

    return {
      ...driver,
      shift: shift || null,
      trips,
    };
  });
}

/**
 * Start duty for a driver. Creates a new shift for today.
 * Rule: can't start if already on duty.
 * @param {string} driverId
 * @returns {Promise<Object>}
 */
export async function startDuty(driverId) {
  await delay();
  ensureInit();

  const driver = getById(NS, driverId);
  if (!driver) throw new ServiceError(`Driver ${driverId} not found.`, 'NOT_FOUND');

  const today = getLocalDate();
  const existing = getShiftForDate(driver, today);

  if (existing && existing.status === DUTY_STATUS.ON_DUTY) {
    throw new ServiceError("You're already on duty. No need to start again.", 'ALREADY_ON_DUTY');
  }

  if (existing && existing.status === DUTY_STATUS.ON_BREAK) {
    throw new ServiceError("You're currently on a break. End your break first.", 'ON_BREAK');
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (existing) {
    // Resume: update status back to on-duty
    existing.status = DUTY_STATUS.ON_DUTY;
  } else {
    // New shift
    driver.shifts.push({
      dayOffset: 0,
      date: today,
      start: currentTime,
      end: '22:00',
      breaks: [],
      status: DUTY_STATUS.ON_DUTY,
    });
  }

  upsert(NS, driver);
  return driver;
}

/**
 * End duty for a driver.
 * Rule: can't end during an On Going trip or open break.
 * @param {string} driverId
 * @returns {Promise<Object>}
 */
export async function endDuty(driverId) {
  await delay();
  ensureInit();

  const driver = getById(NS, driverId);
  if (!driver) throw new ServiceError(`Driver ${driverId} not found.`, 'NOT_FOUND');

  const today = getLocalDate();
  const shift = getShiftForDate(driver, today);

  if (!shift || shift.status === DUTY_STATUS.OFF_DUTY) {
    throw new ServiceError("You're not on duty right now.", 'NOT_ON_DUTY');
  }

  if (shift.status === DUTY_STATUS.ON_BREAK) {
    throw new ServiceError("Please end your break before going off duty.", 'ON_BREAK');
  }

  // Check for ongoing trips — lazy import to avoid circular dep
  const { getAll: getAllItems } = await import('@/lib/storage');
  const { initStore: initBk } = await import('@/lib/storage');
  const { resolveBookingDates } = await import('@/lib/seed');
  const rawBk = (await import('@/data/bookings.json')).default;
  initBk('bookings', resolveBookingDates(rawBk));

  const bookings = getAllItems('bookings');
  const hasOngoing = bookings.some(
    (b) => b.driverId === driverId && b.date === today && b.status === BOOKING_STATUS.ON_GOING
  );
  if (hasOngoing) {
    throw new ServiceError("You have an ongoing trip. Complete it before ending your duty.", 'ONGOING_TRIP');
  }

  const now = new Date();
  shift.end = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  shift.status = DUTY_STATUS.OFF_DUTY;

  upsert(NS, driver);
  return driver;
}

/**
 * Add a break for a driver's shift.
 * Rules: break must be inside duty window, end > start, no overlap with other breaks or trips.
 *
 * Overlap check is O(b + k) where b = breaks, k = trips for that day.
 *
 * @param {string} driverId
 * @param {string} breakStart - HH:MM
 * @param {string} breakEnd - HH:MM
 * @returns {Promise<Object>}
 */
export async function addBreak(driverId, breakStart, breakEnd) {
  await delay();
  ensureInit();

  const driver = getById(NS, driverId);
  if (!driver) throw new ServiceError(`Driver ${driverId} not found.`, 'NOT_FOUND');

  const today = getLocalDate();
  const shift = getShiftForDate(driver, today);

  if (!shift || shift.status === DUTY_STATUS.OFF_DUTY) {
    throw new ServiceError("You must be on duty to add a break.", 'NOT_ON_DUTY');
  }

  const bStart = timeToMinutes(breakStart);
  const bEnd = timeToMinutes(breakEnd);

  if (bEnd <= bStart) {
    throw new ServiceError('Break end time must be after the start time.', 'INVALID_BREAK_TIME');
  }

  // Break must sit inside the duty window
  const shiftStart = timeToMinutes(shift.start);
  const shiftEnd = timeToMinutes(shift.end);
  if (bStart < shiftStart || bEnd > shiftEnd) {
    throw new ServiceError('The break must be within your duty hours.', 'OUTSIDE_SHIFT');
  }

  // Check overlap with existing breaks — O(b)
  for (const existing of shift.breaks) {
    if (rangesOverlap(bStart, bEnd, timeToMinutes(existing.start), timeToMinutes(existing.end))) {
      throw new ServiceError('This break overlaps with an existing break.', 'OVERLAP_BREAK');
    }
  }

  // Check overlap with trips — O(k)
  const { getAll: getAllItems } = await import('@/lib/storage');
  const { initStore: initBk } = await import('@/lib/storage');
  const { resolveBookingDates } = await import('@/lib/seed');
  const rawBk = (await import('@/data/bookings.json')).default;
  initBk('bookings', resolveBookingDates(rawBk));

  const bookings = getAllItems('bookings');
  const driverTrips = bookings.filter(
    (b) =>
      b.driverId === driverId &&
      b.date === today &&
      ![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED].includes(b.status)
  );

  for (const trip of driverTrips) {
    const tripStart = timeToMinutes(trip.time);
    const tripEnd = tripStart + TRIP_DURATION_MIN;
    if (rangesOverlap(bStart, bEnd, tripStart, tripEnd)) {
      throw new ServiceError('This break overlaps with a scheduled trip.', 'OVERLAP_TRIP');
    }
  }

  shift.breaks.push({ start: breakStart, end: breakEnd });
  upsert(NS, driver);
  return driver;
}

/**
 * Start a break (sets driver status to on-break).
 * @param {string} driverId
 * @returns {Promise<Object>}
 */
export async function startBreak(driverId) {
  await delay();
  ensureInit();

  const driver = getById(NS, driverId);
  if (!driver) throw new ServiceError(`Driver ${driverId} not found.`, 'NOT_FOUND');

  const today = getLocalDate();
  const shift = getShiftForDate(driver, today);

  if (!shift || shift.status !== DUTY_STATUS.ON_DUTY) {
    throw new ServiceError("You must be on duty to take a break.", 'NOT_ON_DUTY');
  }

  shift.status = DUTY_STATUS.ON_BREAK;
  upsert(NS, driver);
  return driver;
}

/**
 * End a break (sets driver status back to on-duty).
 * @param {string} driverId
 * @returns {Promise<Object>}
 */
export async function endBreak(driverId) {
  await delay();
  ensureInit();

  const driver = getById(NS, driverId);
  if (!driver) throw new ServiceError(`Driver ${driverId} not found.`, 'NOT_FOUND');

  const today = getLocalDate();
  const shift = getShiftForDate(driver, today);

  if (!shift || shift.status !== DUTY_STATUS.ON_BREAK) {
    throw new ServiceError("You're not currently on a break.", 'NOT_ON_BREAK');
  }

  shift.status = DUTY_STATUS.ON_DUTY;
  upsert(NS, driver);
  return driver;
}

/**
 * Find a free driver for a given date and time.
 * A driver is "free" if they have a shift that covers the requested time
 * and no overlapping trip or break.
 *
 * O(d * (b + k)) where d = drivers, b = breaks per driver, k = trips per driver.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @returns {Promise<Object|null>} The free driver, or null
 */
export async function findFreeDriver(date, time) {
  ensureInit(); // No delay — called internally by createBooking which already delays

  const drivers = getAll(NS);
  const reqStart = timeToMinutes(time);
  const reqEnd = reqStart + TRIP_DURATION_MIN;

  // Lazy import bookings
  const { getAll: getAllItems } = await import('@/lib/storage');
  const { initStore: initBk } = await import('@/lib/storage');
  const { resolveBookingDates } = await import('@/lib/seed');
  const rawBk = (await import('@/data/bookings.json')).default;
  initBk('bookings', resolveBookingDates(rawBk));

  const allBookings = getAllItems('bookings');

  for (const driver of drivers) {
    const shift = getShiftForDate(driver, date);
    if (!shift) continue;
    if (shift.status === DUTY_STATUS.OFF_DUTY) continue;

    // Check if the shift covers the requested time
    const shiftStart = timeToMinutes(shift.start);
    const shiftEnd = timeToMinutes(shift.end);
    if (reqStart < shiftStart || reqEnd > shiftEnd) continue;

    // Check break overlap
    const breakOverlap = shift.breaks.some((b) =>
      rangesOverlap(reqStart, reqEnd, timeToMinutes(b.start), timeToMinutes(b.end))
    );
    if (breakOverlap) continue;

    // Check trip overlap
    const tripOverlap = allBookings.some((b) => {
      if (b.driverId !== driver.id || b.date !== date) return false;
      if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED].includes(b.status)) return false;
      const tripStart = timeToMinutes(b.time);
      const tripEnd = tripStart + TRIP_DURATION_MIN;
      return rangesOverlap(reqStart, reqEnd, tripStart, tripEnd);
    });
    if (tripOverlap) continue;

    return driver;
  }

  return null;
}
