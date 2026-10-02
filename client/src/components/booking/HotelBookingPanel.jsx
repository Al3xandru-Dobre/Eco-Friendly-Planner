import { Link } from 'react-router-dom';
import { useHotelBooking } from '../../hooks/useHotelBooking';
import { money } from '../../lib/format';
import { ErrorBanner, Field, ImpactBar, Spinner } from '../Primitives';
import { TripPicker } from './TripPicker';

/**
 * Availability + booking for one hotel. Dates and guests default from the
 * trip when opened from a trip page; otherwise from tomorrow.
 */
export function HotelBookingPanel({ hotel, defaults = {}, lockedTrip, onBooked }) {
  const {
    user, checkIn, checkOut, guests, rooms, tripId, notes, busyCode, submitError,
    availability: { data, error, loading },
    minCheckIn, minCheckOut,
    setCheckOut, setTripId, setNotes, changeCheckIn, changeGuests, changeRooms, book,
  } = useHotelBooking({ hotel, defaults, lockedTrip, onBooked });

  return (
    <div className="stack">
      <div className="form-grid">
        <Field label="Check-in" htmlFor="checkIn"><input id="checkIn" type="date" className="input" value={checkIn} min={minCheckIn} onChange={(e) => changeCheckIn(e.target.value)} /></Field>
        <Field label="Check-out" htmlFor="checkOut"><input id="checkOut" type="date" className="input" value={checkOut} min={minCheckOut} onChange={(e) => setCheckOut(e.target.value)} /></Field>
        <Field label="Guests" htmlFor="guests"><input id="guests" type="number" className="input" min={1} max={20} value={guests} onChange={(e) => changeGuests(e.target.value)} /></Field>
        <Field label="Rooms" htmlFor="rooms"><input id="rooms" type="number" className="input" min={1} max={10} value={rooms} onChange={(e) => changeRooms(e.target.value)} /></Field>
      </div>
      {user && <TripPicker value={tripId} onChange={setTripId} lockedTrip={lockedTrip} />}
      {user && <Field label="Notes for the hotel" htmlFor="notes"><input id="notes" className="input" placeholder="Arrival by train around 18:00, no daily housekeeping" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} /></Field>}

      <ErrorBanner error={error} prefix="Could not load availability" />
      <ErrorBanner error={submitError} />

      {loading && <Spinner center />}
      {data && !loading && (
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>{data.nights} night{data.nights === 1 ? '' : 's'} · {data.guests} guest{data.guests === 1 ? '' : 's'} · check-in from {hotel.checkInTime}, check-out by {hotel.checkOutTime}</div>
          {data.roomTypes.map((room) => (
            <div key={room.code} className="room-row">
              <div className="stack" style={{ gap: 6 }}>
                <div className="row" style={{ gap: 8 }}>
                  <strong>{room.name}</strong>
                  <span className="badge">sleeps {room.capacity}</span>
                  <span className={`badge ${room.availableRooms === 0 ? 'badge-danger' : room.availableRooms <= 2 ? 'badge-accent' : ''}`}>
                    {room.availableRooms === 0 ? 'Sold out' : `${room.availableRooms} left`}
                  </span>
                  {!room.fitsParty && <span className="badge badge-danger">too small for {data.guests}</span>}
                </div>
                <ImpactBar impact={room.ecoImpact} compact />
              </div>
              <div className="room-cta">
                <div>
                  <div className="price">{money(room.total, room.currency)} <small>total</small></div>
                  <div className="tiny muted">{money(room.pricePerNight, room.currency)} / night</div>
                </div>
                {user ? (
                  <button type="button" className="btn btn-primary btn-sm" disabled={!room.available || busyCode !== null} onClick={() => book(room)}>
                    {busyCode === room.code ? 'Booking…' : 'Book'}
                  </button>
                ) : (
                  <Link className="btn btn-sm btn-ghost" to="/login">Sign in to book</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
