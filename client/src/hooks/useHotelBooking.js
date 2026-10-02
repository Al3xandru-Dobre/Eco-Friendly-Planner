import { useState } from 'react';
import { bookingApi } from '../api/booking';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../lib/useAsync';
import { addDays, today } from '../lib/format';

/**
 * Owns all state and behaviour of the hotel booking panel: the form fields
 * (dates, guests, rooms, trip, notes), date validity, the availability fetch,
 * and the per-room booking submit with its toast / error handling. Returns a
 * flat view-model for the presentational component.
 */
export function useHotelBooking({ hotel, defaults = {}, lockedTrip, onBooked }) {
  const { token, user } = useAuth();
  const toast = useToast();
  const [checkIn, setCheckIn] = useState(defaults.checkIn || addDays(today(), 7));
  const [checkOut, setCheckOut] = useState(defaults.checkOut || addDays(defaults.checkIn || addDays(today(), 7), 2));
  const [guests, setGuests] = useState(defaults.guests || 2);
  const [rooms, setRooms] = useState(1);
  const [tripId, setTripId] = useState(lockedTrip?.id || defaults.tripId || null);
  const [notes, setNotes] = useState('');
  const [busyCode, setBusyCode] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const valid = checkIn && checkOut && checkOut > checkIn;
  const { data, error, loading, reload } = useAsync(
    () => bookingApi.hotelAvailability(hotel.id, { checkIn, checkOut, guests, rooms }),
    [hotel.id, checkIn, checkOut, guests, rooms],
    { enabled: valid },
  );

  function changeCheckIn(value) {
    setCheckIn(value);
    if (checkOut <= value) setCheckOut(addDays(value, 1));
  }

  function changeGuests(value) {
    setGuests(Math.max(1, Number(value) || 1));
  }

  function changeRooms(value) {
    setRooms(Math.max(1, Number(value) || 1));
  }

  async function book(room) {
    setSubmitError(null);
    setBusyCode(room.code);
    try {
      const booking = await bookingApi.bookHotel(token, { hotelId: hotel.id, roomTypeCode: room.code, checkIn, checkOut, guests, rooms, tripId: tripId || undefined, notes: notes || undefined });
      toast.success(`Booked ${hotel.name}`, `${room.name}, ${booking.hotel.nights} night${booking.hotel.nights === 1 ? '' : 's'} · ref ${booking.reference}`);
      onBooked?.(booking);
      reload();
    } catch (err) {
      setSubmitError(err);
      if (err.status === 409) reload();
    } finally {
      setBusyCode(null);
    }
  }

  return {
    user,
    checkIn,
    checkOut,
    guests,
    rooms,
    tripId,
    notes,
    busyCode,
    submitError,
    valid,
    availability: { data, error, loading },
    minCheckIn: today(),
    minCheckOut: addDays(checkIn, 1),
    setCheckOut,
    setTripId,
    setNotes,
    changeCheckIn,
    changeGuests,
    changeRooms,
    book,
  };
}
