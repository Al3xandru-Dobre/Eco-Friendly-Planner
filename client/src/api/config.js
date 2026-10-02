// Both defaults are relative paths so that the Vite dev proxy (vite.config.js)
// and the nginx proxy (nginx.conf) can route them; override with VITE_* vars
// when the client is served from somewhere else.
export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || '/graphql';
export const BOOKING_API_URL = (import.meta.env.VITE_BOOKING_API_URL || '/booking-api/api/v1').replace(/\/$/, '');
export const AUTH_STORAGE_KEY = 'efp.auth';
