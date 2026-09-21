'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce — Debounce a value by a given delay.
 * @param {*} value - The value to debounce
 * @param {number} [delay=300] - Debounce delay in ms
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * useAsyncData — Fetch data from an async function with loading/error state.
 *
 * Safe against:
 * - Unmounted component updates (uses a mounted ref)
 * - Out-of-order responses (uses a call counter)
 *
 * @param {() => Promise<*>} fn - Async data-fetching function
 * @param {Array} deps - Dependency array (re-fetches when these change)
 * @returns {{ data: *|null, loading: boolean, error: Error|null, reload: () => void }}
 */
export function useAsyncData(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const callCountRef = useRef(0);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const load = useCallback(() => {
    const callId = ++callCountRef.current;
    setLoading(true);
    setError(null);

    return fnRef
      .current()
      .then((result) => {
        if (mountedRef.current && callId === callCountRef.current) {
          setData(result);
          setLoading(false);
        }
        return result;
      })
      .catch((err) => {
        if (mountedRef.current && callId === callCountRef.current) {
          setError(err);
          setLoading(false);
        }
        throw err;
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const callId = ++callCountRef.current;

    fn()
      .then((result) => {
        if (mountedRef.current && callId === callCountRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mountedRef.current && callId === callCountRef.current) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: load };
}
