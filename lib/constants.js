/**
 * constants.js — Application-wide constants and design tokens.
 */

/** @enum {string} User roles */
export const ROLES = {
  COMMUTER: 'commuter',
  ADMIN: 'admin',
  DRIVER: 'driver',
};

/** @enum {string} Booking statuses */
export const BOOKING_STATUS = {
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted',
  WAITING: 'Waiting',
  ON_GOING: 'On Going',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
  DECLINED: 'Declined',
};

/** @enum {string} Driver duty statuses */
export const DUTY_STATUS = {
  OFF_DUTY: 'off-duty',
  ON_DUTY: 'on-duty',
  ON_BREAK: 'on-break',
};

/**
 * Status badge color map — Soft tinted backgrounds with crisp text and subtle borders.
 * Used by the StatusBadge component.
 */
export const STATUS_STYLES = {
  [BOOKING_STATUS.COMPLETED]: {
    bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  [BOOKING_STATUS.ACCEPTED]: {
    bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400 dark:text-blue-300',
    dot: 'bg-blue-400',
  },
  [BOOKING_STATUS.WAITING]: {
    bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
  [BOOKING_STATUS.ON_GOING]: {
    bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 dark:text-indigo-300',
    dot: 'bg-indigo-400',
  },
  [BOOKING_STATUS.CANCELLED]: {
    bg: 'bg-red-500/10 border-red-500/20 text-red-400 dark:text-red-300',
    dot: 'bg-red-400',
  },
  [BOOKING_STATUS.NO_SHOW]: {
    bg: 'bg-red-500/10 border-red-500/20 text-red-400 dark:text-red-300',
    dot: 'bg-red-400',
  },
  [BOOKING_STATUS.DECLINED]: {
    bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  [BOOKING_STATUS.REQUESTED]: {
    bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
};

/** Duty status badge styles */
export const DUTY_STYLES = {
  [DUTY_STATUS.OFF_DUTY]: {
    bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  [DUTY_STATUS.ON_DUTY]: {
    bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  [DUTY_STATUS.ON_BREAK]: {
    bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
};

/** Trip duration in minutes (used for timeline block widths) */
export const TRIP_DURATION_MIN = 20;

/** Timeline display range */
export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 22;

/** Table pagination default */
export const PAGE_SIZE = 10;

/** Demo user profiles for role switching */
export const DEMO_USERS = {
  [ROLES.COMMUTER]: { id: 'u1', name: 'Aarav Mehta', avatar: 'AM' },
  [ROLES.ADMIN]: { id: 'admin1', name: 'Admin User', avatar: 'AU' },
  [ROLES.DRIVER]: { id: 'd1', name: 'Rajesh Kumar', avatar: 'RK' },
};

/** Selectable demo identities for commuter and driver testing. */
export const DEMO_USER_OPTIONS = {
  [ROLES.COMMUTER]: [
    DEMO_USERS[ROLES.COMMUTER],
    { id: 'u2', name: 'Priya Iyer', avatar: 'PI' },
    { id: 'u3', name: 'Rohan Das', avatar: 'RD' },
  ],
  [ROLES.DRIVER]: [
    DEMO_USERS[ROLES.DRIVER],
    { id: 'd2', name: 'Sunil Patil', avatar: 'SP' },
    { id: 'd3', name: 'Pradeep Singh', avatar: 'PS' },
  ],
};
