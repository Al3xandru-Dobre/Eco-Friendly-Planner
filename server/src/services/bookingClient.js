/**
 * Thin HTTP client for the dedicated booking API.
 *
 * The planner never talks to the booking database; it forwards the caller's
 * own bearer token so the booking API applies exactly the same ownership
 * rules it applies to the browser. That keeps a single source of truth for
 * authorization and lets each service be deployed on its own.
 */
const BOOKING_API_URL = (process.env.BOOKING_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.BOOKING_API_TIMEOUT_MS) || 5000;

class BookingApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'BookingApiError';
    this.status = status;
    this.code = code;
  }
}

async function request(path, { authorization, method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BOOKING_API_URL}/api/v1${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = payload.error || {};
      throw new BookingApiError(res.status, err.code || 'BOOKING_API_ERROR', err.message || `Booking API responded ${res.status}`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

const withQuery = (path, params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
};

module.exports = {
  BookingApiError,
  BOOKING_API_URL,
  listBookings: (authorization, params) => request(withQuery('/bookings', params), { authorization }).then((r) => r.items),
  getSummary: (authorization, params) => request(withQuery('/bookings/summary', params), { authorization }),
};
