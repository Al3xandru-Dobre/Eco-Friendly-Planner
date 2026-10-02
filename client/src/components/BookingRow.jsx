import { Bed, Fork } from './Icons';
import { fmtDate, fmtRange, money } from '../lib/format';

export function BookingRow({ booking, onCancel, busy = false, showTripLink }) {
  const isHotel = booking.type === 'HOTEL';
  const cancelled = booking.status === 'CANCELLED';
  const when = isHotel
    ? `${fmtRange(booking.hotel.checkIn, booking.hotel.checkOut)} · ${booking.hotel.nights} night${booking.hotel.nights === 1 ? '' : 's'} · ${booking.hotel.guests} guest${booking.hotel.guests === 1 ? '' : 's'}`
    : `${fmtDate(booking.restaurant.date, { weekday: 'short', day: 'numeric', month: 'short' })} at ${booking.restaurant.time} · table for ${booking.restaurant.partySize}`;
  return (
    <div className={`card booking-row${cancelled ? ' cancelled' : ''}`}>
      <div className="icon">{isHotel ? <Bed /> : <Fork />}</div>
      <div>
        <div className="row" style={{ gap: 8 }}>
          <strong>{booking.venue.name}</strong>
          <span className={`badge ${cancelled ? 'badge-danger' : 'badge-success'}`}>{cancelled ? 'Cancelled' : 'Confirmed'}</span>
          <span className="tiny faint mono">{booking.reference}</span>
        </div>
        <div className="small muted">{isHotel ? booking.hotel.roomTypeName : booking.venue.city} · {when}</div>
        <div className="tiny muted">
          {money(booking.pricing.total, booking.pricing.currency)} · {booking.ecoImpact.carbonKgCO2e} kg CO₂e
          {booking.ecoImpact.carbonSavedKgCO2e > 0 && <> · saves {booking.ecoImpact.carbonSavedKgCO2e} kg vs conventional</>}
          {showTripLink}
        </div>
      </div>
      <div className="actions">
        {!cancelled && onCancel && (
          <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => onCancel(booking)}>Cancel</button>
        )}
      </div>
    </div>
  );
}
