/**
 * storage.js — Persistent data store using in-memory Map + localStorage.
 *
 * SSR-safe: all localStorage calls are wrapped in try/catch and gated on
 * `typeof window`. The in-memory Map is always the primary source of truth;
 * localStorage is only used for persistence across page reloads.
 *
 * Each collection is keyed by a namespace string (e.g. 'bookings', 'drivers').
 * Items within a collection are stored in a Map keyed by their `id` field
 * for O(1) lookup by ID.
 */

/** @type {Map<string, Map<string, Object>>} namespace → id → item */
const store = new Map();

/** Track whether a namespace has been initialized */
const initialized = new Set();

/**
 * Check if we're in a browser environment.
 * @returns {boolean}
 */
function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Try to read a namespace from localStorage.
 * @param {string} namespace
 * @returns {Array<Object>|null}
 */
function readFromLS(namespace) {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(`campusride_${namespace}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a namespace's Map to localStorage.
 * @param {string} namespace
 */
function writeToLS(namespace) {
  if (!isBrowser()) return;
  try {
    const map = store.get(namespace);
    if (map) {
      localStorage.setItem(`campusride_${namespace}`, JSON.stringify([...map.values()]));
    }
  } catch {
    // Silently fail — localStorage may be full or blocked
  }
}

/**
 * Initialize a namespace with seed data. If localStorage already has data
 * for this namespace, use that instead (preserves changes across reloads).
 *
 * O(n) where n = number of items — runs once per namespace.
 *
 * @param {string} namespace - e.g. 'bookings'
 * @param {Array<Object>} seedData - Array of objects, each with an `id` field
 */
export function initStore(namespace, seedData) {
  if (initialized.has(namespace)) return;

  const existing = readFromLS(namespace);
  const items = existing || seedData;
  const map = new Map();

  // O(n) — build the lookup map
  for (const item of items) {
    map.set(item.id, { ...item });
  }

  store.set(namespace, map);
  initialized.add(namespace);

  // If we used seed data (no localStorage), persist it
  if (!existing) writeToLS(namespace);
}

/**
 * Get all items in a namespace as an array.
 * O(n) — copies values out of the Map.
 * @param {string} namespace
 * @returns {Array<Object>}
 */
export function getAll(namespace) {
  const map = store.get(namespace);
  return map ? [...map.values()] : [];
}

/**
 * Get a single item by ID. O(1) lookup.
 * @param {string} namespace
 * @param {string} id
 * @returns {Object|undefined}
 */
export function getById(namespace, id) {
  const map = store.get(namespace);
  const item = map?.get(id);
  return item ? { ...item } : undefined;
}

/**
 * Add or replace an item. O(1) insert + O(n) localStorage write.
 * @param {string} namespace
 * @param {Object} item - Must have an `id` field
 */
export function upsert(namespace, item) {
  let map = store.get(namespace);
  if (!map) {
    map = new Map();
    store.set(namespace, map);
  }
  map.set(item.id, { ...item });
  writeToLS(namespace);
}

/**
 * Remove an item by ID. O(1) delete + O(n) localStorage write.
 * @param {string} namespace
 * @param {string} id
 * @returns {boolean} true if the item existed
 */
export function remove(namespace, id) {
  const map = store.get(namespace);
  if (!map) return false;
  const existed = map.delete(id);
  if (existed) writeToLS(namespace);
  return existed;
}

/**
 * Reset all data — clears in-memory store and localStorage.
 * Used by the "Reset demo data" button in the preview page.
 */
export function resetAllData() {
  store.clear();
  initialized.clear();
  if (isBrowser()) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('campusride_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Silently fail
    }
  }
}
