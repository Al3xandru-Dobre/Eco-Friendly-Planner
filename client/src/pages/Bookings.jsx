import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/booking';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../lib/useAsync';
import { BookingRow } from '../components/BookingRow';
import { EmptyState, ErrorBanner, Spinner, Stat } from '../components/Primitives';
import { Segmented } from '../components/Tabs';

export function Bookings() {
  const { token } = useAuth();
  const toast = useToast();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  const [cancelling, setCancelling] = useState(null);

  const list = useAsync(() => bookingApi.myBookings(token, { type: type || undefined, status: status || undefined }).then((r) => r.items), [token, type, status]);
  const summary = useAsync(() => bookingApi.summary(token), [token]);

  async function cancel(booking) {
    setCancelling(booking.id);
    try {
      await bookingApi.cancel(token, booking.id);
      toast.success('Booking cancelled', `${booking.venue.name} · ${booking.reference}`);
      list.reload(); summary.reload();
    } catch (err) { toast.error('Could not cancel', err.message); } finally { setCancelling(null); }
  }

  const s = summary.data;
  return (
    <div className="container page">
      <div className="page-head">
        <div><div className="eyebrow">Reservations</div><h1>My bookings</h1></div>
        <Link to="/explore" className="btn btn-primary">Find a stay or table</Link>
      </div>

      {s && (
        <div className="stats" style={{ marginBottom: 26 }}>
          <Stat label="Confirmed" value={s.confirmedCount} />
          <Stat label="Room-nights" value={s.hotelNights} />
          <Stat label="Dinner covers" value={s.restaurantCovers} />
          <Stat label="Footprint" value={s.carbonKgCO2e.toFixed(1)} unit="kg CO₂e" />
          <Stat label="Saved vs conventional" value={s.carbonSavedKgCO2e.toFixed(1)} unit="kg CO₂e" tone="good" />
        </div>
      )}

      <div className="row between" style={{ marginBottom: 18 }}>
        <Segmented value={type} onChange={setType} options={[{ value: '', label: 'All' }, { value: 'HOTEL', label: 'Stays' }, { value: 'RESTAURANT', label: 'Dining' }]} />
        <Segmented value={status} onChange={setStatus} options={[{ value: 'CONFIRMED', label: 'Confirmed' }, { value: 'CANCELLED', label: 'Cancelled' }, { value: '', label: 'Everything' }]} />
      </div>

      <ErrorBanner error={list.error || summary.error} prefix="Booking service unavailable" />
      {list.loading && <Spinner center />}
      {list.data && !list.loading && (list.data.length ? (
        <div className="stack" style={{ gap: 10 }}>
          {list.data.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={cancel} busy={cancelling === b.id}
              showTripLink={b.tripId ? <> · <Link to={`/trips/${b.tripId}`}>view trip</Link></> : null} />
          ))}
        </div>
      ) : (
        <EmptyState title="No bookings here">Reserve a stay or a table from a trip page or from Explore.</EmptyState>
      ))}
    </div>
  );
}
