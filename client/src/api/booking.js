import { BOOKING_API_URL } from './config';

export class BookingApiError extends Error {
  constructor(status, { code, message, details } = {}) {
    super(message || `Booking API returned ${status}`);
    this.name = 'BookingApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', params, body, token } = {}) {
  const qs = params
    ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    : '';
  const res = await fetch(`${BOOKING_API_URL}${path}${qs ? `?${qs}` : ''}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new BookingApiError(res.status, payload.error);
  return payload;
}

export const bookingApi = {
  destinations: () => request('/destinations'),
  reference: () => request('/reference'),
  hotels: (params) => request('/hotels', { params }),
  hotel: (id) => request(`/hotels/${encodeURIComponent(id)}`),
  hotelAvailability: (id, params) => request(`/hotels/${encodeURIComponent(id)}/availability`, { params }),
  restaurants: (params) => request('/restaurants', { params }),
  restaurant: (id) => request(`/restaurants/${encodeURIComponent(id)}`),
  restaurantAvailability: (id, params) => request(`/restaurants/${encodeURIComponent(id)}/availability`, { params }),
  myBookings: (token, params) => request('/bookings', { token, params }),
  summary: (token, params) => request('/bookings/summary', { token, params }),
  bookHotel: (token, body) => request('/bookings/hotels', { method: 'POST', token, body }),
  bookRestaurant: (token, body) => request('/bookings/restaurants', { method: 'POST', token, body }),
  cancel: (token, id) => request(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
};
