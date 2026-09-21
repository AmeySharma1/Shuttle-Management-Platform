/**
 * utils.js — General-purpose utilities: className merging, date/time helpers, ID generation.
 */

/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to clsx/classnames.
 * @param {...(string|boolean|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 * @returns {string}
 */
export function getLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Convert a HH:MM time string to total minutes since midnight.
 * @param {string} time - e.g. "14:30"
 * @returns {number} e.g. 870
 */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert a HH:MM (24h) string to a 12-hour format with am/pm.
 * @param {string} time - e.g. "14:30"
 * @returns {string} e.g. "2:30 PM"
 */
export function formatTime12h(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Format a YYYY-MM-DD date to a human-readable string.
 * @param {string} dateStr - e.g. "2026-09-21"
 * @returns {string} e.g. "Sep 21, 2026"
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date as a relative label: "Today", "Yesterday", "Tomorrow", or the formatted date.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function formatDateRelative(dateStr) {
  const today = getLocalDate();
  if (dateStr === today) return 'Today';

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (dateStr === yesterday) return 'Yesterday';

  const t = new Date();
  t.setDate(t.getDate() + 1);
  const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  if (dateStr === tomorrow) return 'Tomorrow';

  return formatDate(dateStr);
}

/**
 * Check if two time ranges overlap. Ranges are [start, end) in minutes.
 * O(1) — simple arithmetic comparison.
 * @param {number} start1 - Start of range 1 (minutes)
 * @param {number} end1 - End of range 1 (minutes)
 * @param {number} start2 - Start of range 2 (minutes)
 * @param {number} end2 - End of range 2 (minutes)
 * @returns {boolean}
 */
export function rangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Generate a short unique ID with a prefix.
 * @param {string} prefix - e.g. "BK"
 * @returns {string} e.g. "BK-4827"
 */
export function makeId(prefix) {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

/**
 * Get initials from a full name (first + last letter).
 * @param {string} name - e.g. "Aarav Mehta"
 * @returns {string} e.g. "AM"
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Check if a time string is in the past for today.
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @returns {boolean}
 */
export function isTimeInPast(date, time) {
  const today = getLocalDate();
  if (date > today) return false;
  if (date < today) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(time) < currentMinutes;
}

/**
 * Debounce delay in ms for search inputs.
 */
export const DEBOUNCE_MS = 300;
