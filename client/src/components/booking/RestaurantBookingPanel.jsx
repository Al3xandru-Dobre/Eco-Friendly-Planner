import { Link } from 'react-router-dom';
import { useRestaurantBooking } from '../../hooks/useRestaurantBooking';
import { openingSummary } from '../../lib/openingHours';
import { fmtDate, money } from '../../lib/format';
import { ErrorBanner, Field, ImpactBar, Spinner } from '../Primitives';
import { TripPicker } from './TripPicker';

export function RestaurantBookingPanel({ restaurant, defaults = {}, dateBounds = {}, lockedTrip, onBooked }) {
  const {
    user, date, partySize, time, tripId, notes, busy, submitError,
    availability: { data, error, loading },
    minDate, maxDate,
    setTime, setTripId, setNotes, changeDate, changePartySize, reserve,
  } = useRestaurantBooking({ restaurant, defaults, dateBounds, lockedTrip, onBooked });

  return (
    <div className="stack">
      <div className="form-grid">
        <Field label="Date" htmlFor="date" hint={openingSummary(restaurant)}>
          <input id="date" type="date" className="input" value={date} min={minDate} max={maxDate} onChange={(e) => changeDate(e.target.value)} />
        </Field>
        <Field label="Party size" htmlFor="partySize">
          <input id="partySize" type="number" className="input" min={1} max={30} value={partySize} onChange={(e) => changePartySize(e.target.value)} />
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
