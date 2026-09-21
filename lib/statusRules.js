/**
 * statusRules.js — Booking status transition rules and guard helpers.
 *
 * The allowed transitions map is the single source of truth for what status
 * changes are valid. All service-layer mutations go through validateTransition().
 */

import { BOOKING_STATUS } from './constants';

const { REQUESTED, ACCEPTED, WAITING, ON_GOING, COMPLETED, CANCELLED, NO_SHOW, DECLINED } = BOOKING_STATUS;

/**
 * Map of current status → set of allowed next statuses.
 * Final states (Completed, Cancelled, No Show, Declined) have no outgoing transitions.
 */
const ALLOWED_TRANSITIONS = {
  [REQUESTED]: new Set([ACCEPTED, DECLINED, CANCELLED]),
  [ACCEPTED]: new Set([WAITING, ON_GOING, CANCELLED, NO_SHOW]),
  [WAITING]: new Set([ON_GOING, CANCELLED, NO_SHOW]),
  [ON_GOING]: new Set([COMPLETED]),
  [COMPLETED]: new Set(),
  [CANCELLED]: new Set(),
  [NO_SHOW]: new Set(),
  [DECLINED]: new Set(),
};

/** Set of statuses that cannot change anymore */
const FINAL_STATUSES = new Set([COMPLETED, CANCELLED, NO_SHOW, DECLINED]);

/**
 * Check if a status transition is valid.
 * @param {string} from - Current status
 * @param {string} to - Desired next status
 * @returns {boolean}
 */
export function isValidTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
}

/**
 * Can the booking be cancelled from its current status?
 * Cancel is blocked once a trip is On Going or in a final state.
 * @param {string} status
 * @returns {boolean}
 */
export function canCancel(status) {
  return isValidTransition(status, CANCELLED);
}

/**
 * Can the booking be edited (time/route)?
 * Only allowed in Requested, Accepted, or Waiting.
 * @param {string} status
 * @returns {boolean}
 */
export function canEdit(status) {
  return [REQUESTED, ACCEPTED, WAITING].includes(status);
}

/**
 * Can the rider be signed in (marks them as boarded → On Going)?
 * Only from Accepted or Waiting.
 * @param {string} status
 * @returns {boolean}
 */
export function canSignIn(status) {
  return [ACCEPTED, WAITING].includes(status);
}

/**
 * Can the booking be marked as No Show?
 * Only from Accepted or Waiting.
 * @param {string} status
 * @returns {boolean}
 */
export function canMarkNoShow(status) {
  return [ACCEPTED, WAITING].includes(status);
}

/**
 * Can the trip be started by a driver?
 * Only from Accepted (driver starts trip directly).
 * @param {string} status
 * @returns {boolean}
 */
export function canStartTrip(status) {
  return isValidTransition(status, ON_GOING);
}

/**
 * Can the trip be completed?
 * Only from On Going.
 * @param {string} status
 * @returns {boolean}
 */
export function canCompleteTrip(status) {
  return isValidTransition(status, COMPLETED);
}

/**
 * Get a friendly, human-readable reason why an action is blocked.
 * @param {'cancel'|'edit'|'signIn'|'noShow'|'startTrip'|'completeTrip'} action
 * @param {string} status - Current booking status
 * @returns {string|null} A friendly message, or null if the action is allowed
 */
export function getBlockedReason(action, status) {
  const statusLabel = status.toLowerCase();
  const isFinal = FINAL_STATUSES.has(status);

  switch (action) {
    case 'cancel':
      if (!canCancel(status)) {
        if (status === ON_GOING) return "This trip is currently in progress and can't be cancelled.";
        if (isFinal) return `This trip is already ${statusLabel}, so it can't be cancelled.`;
        return `A ${statusLabel} trip can't be cancelled.`;
      }
      return null;

    case 'edit':
      if (!canEdit(status)) {
        if (status === ON_GOING) return "You can't edit a trip that's already in progress.";
        if (isFinal) return `This trip is already ${statusLabel} and can't be modified.`;
        return `A ${statusLabel} trip can't be edited.`;
      }
      return null;

    case 'signIn':
      if (!canSignIn(status)) {
        if (status === ON_GOING) return 'This rider is already on board.';
        if (isFinal) return `This trip is already ${statusLabel}. The rider can't be signed in.`;
        return `The rider can only be signed in for accepted or waiting trips.`;
      }
      return null;

    case 'noShow':
      if (!canMarkNoShow(status)) {
        if (status === ON_GOING) return "This trip is in progress — the rider is already on board.";
        if (isFinal) return `This trip is already ${statusLabel}. It can't be marked as no-show.`;
        return `A ${statusLabel} trip can't be marked as no-show.`;
      }
      return null;

    case 'startTrip':
      if (!canStartTrip(status)) {
        if (status === ON_GOING) return 'This trip has already started.';
        if (isFinal) return `This trip is already ${statusLabel} and can't be started.`;
        return `A ${statusLabel} trip can't be started.`;
      }
      return null;

    case 'completeTrip':
      if (!canCompleteTrip(status)) {
        if (status !== ON_GOING) return 'Only trips that are in progress can be completed.';
        if (isFinal) return `This trip is already ${statusLabel}.`;
        return `A ${statusLabel} trip can't be completed.`;
      }
      return null;

    default:
      return null;
  }
}
