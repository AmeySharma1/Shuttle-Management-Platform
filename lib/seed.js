/**
 * seed.js — Converts dayOffset values in seed data to real YYYY-MM-DD strings.
 * dayOffset: 0 = today, -1 = yesterday, +1 = tomorrow, etc.
 */

/**
 * Get a date string relative to today.
 * @param {number} dayOffset - Number of days from today (negative = past)
 * @returns {string} YYYY-MM-DD formatted date
 */
export function offsetToDate(dayOffset) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Resolve all dayOffset fields in an array of booking objects to real date strings.
 * @param {Array<Object>} bookings - Raw booking objects with dayOffset
 * @returns {Array<Object>} Bookings with `date` field (YYYY-MM-DD) instead of dayOffset
 */
export function resolveBookingDates(bookings) {
  return bookings.map((b) => ({
    ...b,
    date: offsetToDate(b.dayOffset),
  }));
}

/**
 * Resolve shift dayOffsets in driver data to real date strings.
 * @param {Array<Object>} drivers - Raw driver objects with shifts containing dayOffset
 * @returns {Array<Object>} Drivers with resolved shift dates
 */
export function resolveDriverDates(drivers) {
  return drivers.map((d) => ({
    ...d,
    shifts: d.shifts.map((s) => ({
      ...s,
      date: offsetToDate(s.dayOffset),
    })),
  }));
}
