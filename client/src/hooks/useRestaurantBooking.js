import { useState } from 'react';
import { bookingApi } from '../api/booking';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../lib/useAsync';
import { addDays, fmtDate, today } from '../lib/format';

/**
 * Owns all state and behaviour of the restaurant booking panel: the form
 * fields (date, party size, time slot, trip, notes), the availability fetch,
 * and the reservation submit with its toast / error handling. Returns a flat
 * view-model for the presentational component.
 */
export function useRestaurantBooking({ restaurant, defaults = {}, dateBounds = {}, lockedTrip, onBooked }) {
  const { token, user } = useAuth();
  const toast = useToast();
  const [date, setDate] = useState(defaults.date || dateBounds.min || addDays(today(), 1));
  const [partySize, setPartySize] = useState(defaults.partySize || 2);
  const [time, setTime] = useState(null);
  const [tripId, setTripId] = useState(lockedTrip?.id || defaults.tripId || null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { data, error, loading, reload } = useAsync(
    () => bookingApi.restaurantAvailability(restaurant.id, { date, partySize }),
    [restaurant.id, date, partySize],
    { enabled: Boolean(date) },
  );

  function changeDate(value) {
    setDate(value);
    setTime(null);
  }

  function changePartySize(value) {
    setPartySize(Math.max(1, Number(value) || 1));
    setTime(null);
  }

  async function reserve() {
    if (!time) return;
    setSubmitError(null);
    setBusy(true);
    try {
      const booking = await bookingApi.bookRestaurant(token, { restaurantId: restaurant.id, date, time, partySize, tripId: tripId || undefined, notes: notes || undefined });
      toast.success(`Table reserved at ${restaurant.name}`, `${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} at ${time} for ${partySize} · ref ${booking.reference}`);
      onBooked?.(booking);
      setTime(null);
      reload();
    } catch (err) {
      setSubmitError(err);
      if (err.status === 409) reload();
    } finally {
      setBusy(false);
    }
  }

  return {
    user,
    date,
    partySize,
    time,
    tripId,
    notes,
    busy,
    submitError,
    availability: { data, error, loading },
    minDate: dateBounds.min || today(),
    maxDate: dateBounds.max || undefined,
    setTime,
    setTripId,
    setNotes,
    changeDate,
    changePartySize,
    reserve,
  };
}
