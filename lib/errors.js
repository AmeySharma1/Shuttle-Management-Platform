/**
 * errors.js — Custom error class for service-layer validation errors.
 */

/**
 * ServiceError is thrown by services when a business rule is violated.
 * The `message` is always a user-friendly sentence suitable for toasts.
 * The `code` helps programmatic consumers distinguish error types.
 */
export class ServiceError extends Error {
  /**
   * @param {string} message - Friendly error message for the UI
   * @param {string} code - Machine-readable error code (e.g. 'INVALID_TRANSITION')
   */
  constructor(message, code = 'SERVICE_ERROR') {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}
