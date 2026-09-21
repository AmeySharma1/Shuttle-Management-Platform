/**
 * routeService.js — Route and stop management.
 *
 * Every public function is async with a 300-500ms artificial delay.
 * State lives in the storage layer (in-memory Map + localStorage).
 */

import { initStore, getAll, getById, upsert } from '@/lib/storage';
import { ServiceError } from '@/lib/errors';
import { makeId } from '@/lib/utils';
import rawRoutes from '@/data/routes.json';
import rawStops from '@/data/stops.json';

const NS_ROUTES = 'routes';
const NS_STOPS = 'stops';

function delay() {
  const ms = 300 + Math.random() * 200;
  return new Promise((r) => setTimeout(r, ms));
}

function ensureInit() {
  initStore(NS_ROUTES, rawRoutes);
  initStore(NS_STOPS, rawStops);
}

/**
 * Get all campus stops. O(n).
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getStops() {
  await delay();
  ensureInit();
  return getAll(NS_STOPS);
}

/**
 * Get a stop name by its ID.
 * @param {string} stopId
 * @returns {string}
 */
export function getStopName(stopId) {
  ensureInit();
  const stop = getById(NS_STOPS, stopId);
  return stop ? stop.name : (stopId || '');
}

/**
 * Get a map of all stop ID -> stop name.
 * @returns {Record<string, string>}
 */
export function getStopsMap() {
  ensureInit();
  const stops = getAll(NS_STOPS);
  const map = {};
  for (const s of stops) {
    map[s.id] = s.name;
  }
  return map;
}

/**
 * Get all routes. O(n).
 * @returns {Promise<Array<Object>>}
 */
export async function getRoutes() {
  await delay();
  ensureInit();
  return getAll(NS_ROUTES);
}

/**
 * Get a single route by ID. O(1).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getRouteById(id) {
  await delay();
  ensureInit();
  const route = getById(NS_ROUTES, id);
  if (!route) throw new ServiceError(`Route ${id} not found.`, 'NOT_FOUND');
  return route;
}

/**
 * Create a new route.
 * Rules: name required, at least 2 stops, no duplicate stops.
 *
 * Duplicate check is O(s) using a Set.
 *
 * @param {Object} data
 * @param {string} data.name - Route name
 * @param {Array<string>} data.stopIds - Ordered array of stop IDs
 * @returns {Promise<Object>}
 */
export async function createRoute(data) {
  await delay();
  ensureInit();

  if (!data.name?.trim()) {
    throw new ServiceError('Please enter a route name.', 'MISSING_NAME');
  }

  if (!data.stopIds || data.stopIds.length < 2) {
    throw new ServiceError('A route needs at least 2 stops.', 'TOO_FEW_STOPS');
  }

  // O(s) duplicate check using a Set
  const unique = new Set(data.stopIds);
  if (unique.size !== data.stopIds.length) {
    throw new ServiceError('A route cannot have duplicate stops.', 'DUPLICATE_STOPS');
  }

  // Validate all stop IDs exist
  const validStops = new Set(getAll(NS_STOPS).map((s) => s.id));
  for (const sid of data.stopIds) {
    if (!validStops.has(sid)) {
      throw new ServiceError(`Stop "${sid}" doesn't exist.`, 'INVALID_STOP');
    }
  }

  const route = {
    id: makeId('RT'),
    name: data.name.trim(),
    stopIds: data.stopIds,
    driverId: null,
    active: true,
  };

  upsert(NS_ROUTES, route);
  return route;
}

/**
 * Update a route (name, stops, active status).
 *
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateRoute(id, updates) {
  await delay();
  ensureInit();

  const route = getById(NS_ROUTES, id);
  if (!route) throw new ServiceError(`Route ${id} not found.`, 'NOT_FOUND');

  if (updates.name !== undefined && !updates.name.trim()) {
    throw new ServiceError('Route name cannot be empty.', 'MISSING_NAME');
  }

  if (updates.stopIds) {
    if (updates.stopIds.length < 2) {
      throw new ServiceError('A route needs at least 2 stops.', 'TOO_FEW_STOPS');
    }
    const unique = new Set(updates.stopIds);
    if (unique.size !== updates.stopIds.length) {
      throw new ServiceError('A route cannot have duplicate stops.', 'DUPLICATE_STOPS');
    }
  }

  const updated = {
    ...route,
    ...(updates.name !== undefined && { name: updates.name.trim() }),
    ...(updates.stopIds && { stopIds: updates.stopIds }),
    ...(updates.active !== undefined && { active: updates.active }),
  };

  upsert(NS_ROUTES, updated);
  return updated;
}

/**
 * Assign a driver to a route.
 * @param {string} routeId
 * @param {string|null} driverId - Driver ID or null to unassign
 * @returns {Promise<Object>}
 */
export async function assignDriver(routeId, driverId) {
  await delay();
  ensureInit();

  const route = getById(NS_ROUTES, routeId);
  if (!route) throw new ServiceError(`Route ${routeId} not found.`, 'NOT_FOUND');

  if (driverId) {
    // Validate driver exists
    const { getById: getDriverById } = await import('@/lib/storage');
    const { initStore: initDrivers } = await import('@/lib/storage');
    const { resolveDriverDates } = await import('@/lib/seed');
    const rawDr = (await import('@/data/drivers.json')).default;
    initDrivers('drivers', resolveDriverDates(rawDr));

    const driver = getDriverById('drivers', driverId);
    if (!driver) throw new ServiceError(`Driver ${driverId} not found.`, 'NOT_FOUND');
  }

  route.driverId = driverId;
  upsert(NS_ROUTES, route);
  return route;
}
