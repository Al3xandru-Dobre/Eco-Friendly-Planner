import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api/booking';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../lib/useAsync';
import { addDays, fmtDate, money, today } from '../../lib/format';
import { ErrorBanner, Field, ImpactBar, Spinner } from '../Primitives';
import { TripPicker } from './TripPicker';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function openingSummary(restaurant) {
  return restaurant.openingHours.map((p) => {
    const days = p.days.length === 7 ? 'Daily' : p.days.map((d) => DAY_NAMES[d]).join(', ');
    return `${days} ${p.open}–${p.close}`;
  }).join(' · ');
}

export function RestaurantBookingPanel({ restaurant, defaults = {}, dateBounds = {}, lockedTrip, onBooked }) {
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

  return (
    <div className="stack">
      <div className="form-grid">
        <Field label="Date" htmlFor="date" hint={openingSummary(restaurant)}>
          <input id="date" type="date" className="input" value={date} min={dateBounds.min || today()} max={dateBounds.max || undefined} onChange={(e) => { setDate(e.target.value); setTime(null); }} />
        </Field>
        <Field label="Party size" htmlFor="partySize">
          <input id="partySize" type="number" className="input" min={1} max={30} value={partySize} onChange={(e) => { setPartySize(Math.max(1, Number(e.target.value) || 1)); setTime(null); }} />
        </Field>
      </div>
      {user && <TripPicker value={tripId} onChange={setTripId} lockedTrip={lockedTrip} />}
      {user && <Field label="Notes for the restaurant" htmlFor="rnotes"><input id="rnotes" className="input" placeholder="One vegan guest, window table if possible" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} /></Field>}

      <ErrorBanner error={error} prefix="Could not load availability" />
      <ErrorBanner error={submitError} />

      {loading && <Spinner center />}
      {data && !loading && (
        data.open ? (
          <div className="stack">
            <div>
              <div className="small muted" style={{ marginBottom: 8 }}>Tables are held for {data.seatingMinutes} minutes. Pick a time:</div>
              <div className="slots">
                {data.slots.map((s) => (
                  <button key={s.time} type="button" className={`chip${time === s.time ? ' active' : ''}`} disabled={!s.available} onClick={() => setTime(s.time)} title={s.available ? `${s.availableSeats} seats left` : 'Fully booked'}>
                    {s.time}
                  </button>
                ))}
              </div>
            </div>
            <ImpactBar impact={data.ecoImpact} />
            <div className="row between">
              <div className="price">{money(data.estimatedTotal, restaurant.currency)} <small>estimated for {partySize}</small></div>
              {user ? (
                <button type="button" className="btn btn-primary" disabled={!time || busy} onClick={reserve}>{busy ? 'Reserving…' : time ? `Reserve ${time}` : 'Pick a time'}</button>
              ) : (
                <Link className="btn btn-ghost" to="/login">Sign in to reserve</Link>
              )}
            </div>
          </div>
        ) : (
          <div className="banner info">{restaurant.name} is closed on {fmtDate(date, { weekday: 'long' })}s. Try another date.</div>
        )
      )}
    </div>
  );
}
