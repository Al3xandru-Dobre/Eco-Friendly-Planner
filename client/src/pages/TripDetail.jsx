import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { gql } from '../api/graphql';
import { bookingApi } from '../api/booking';
import { DELETE_TRIP, TRIP } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../lib/useAsync';
import { dateOnly, fmtRange, kg, matchDestination, nightsBetween } from '../lib/format';
import { transportLabel } from '../lib/trips';
import { EcoScore } from '../components/EcoScore';
import { Tabs } from '../components/Tabs';
import { HotelCard, RestaurantCard } from '../components/VenueCard';
import { BookingRow } from '../components/BookingRow';
import { HotelDetailModal, RestaurantDetailModal } from '../components/booking/VenueDetail';
import { EmptyState, ErrorBanner, Spinner, Stat } from '../components/Primitives';
import { Calendar, Train, Trash, Users } from '../components/Icons';

export function TripDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [selected, setSelected] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const trip = useAsync(() => gql(TRIP, { id }, token).then((d) => d.getTrip), [id, token]);
  const destinations = useAsync(() => bookingApi.destinations().then((d) => d.items), []);

  const t = trip.data;
  const match = useMemo(() => (t && destinations.data ? matchDestination(t.destination, destinations.data) : null), [t, destinations.data]);
  const city = match?.city;
  const stay = t ? { checkIn: dateOnly(t.startDate), checkOut: dateOnly(t.endDate), guests: t.numberOfTravelers || 1 } : null;

  const hotels = useAsync(() => bookingApi.hotels({ city, checkIn: stay.checkIn, checkOut: stay.checkOut, guests: stay.guests, limit: 30 }), [city, stay?.checkIn, stay?.checkOut, stay?.guests], { enabled: Boolean(city) && tab === 'stays' });
  const restaurants = useAsync(() => bookingApi.restaurants({ city, limit: 30 }), [city], { enabled: Boolean(city) && tab === 'dining' });

  async function cancel(booking) {
    setCancelling(booking.id);
    try {
      await bookingApi.cancel(token, booking.id);
      toast.success('Booking cancelled', `${booking.venue.name} · ${booking.reference}`);
      trip.reload();
    } catch (err) { toast.error('Could not cancel', err.message); } finally { setCancelling(null); }
  }

  async function remove() {
    if (!window.confirm(`Delete the trip to ${t.destination}? Bookings made through the booking service are kept and can be cancelled from the Bookings page.`)) return;
    try {
      await gql(DELETE_TRIP, { id }, token);
      toast.success('Trip deleted');
      navigate('/trips');
    } catch (err) { toast.error('Could not delete trip', err.message); }
  }

  if (trip.loading) return <div className="container page"><Spinner center /></div>;
  if (trip.error || !t) return <div className="container page"><ErrorBanner error={trip.error || 'Trip not found'} /><Link to="/trips" className="btn btn-ghost" style={{ marginTop: 16 }}>Back to trips</Link></div>;

  const summary = t.bookingSummary;
  const confirmed = (t.bookings || []).filter((b) => b.status === 'CONFIRMED');
  const nights = nightsBetween(t.startDate, t.endDate);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stays', label: 'Stays' },
    { id: 'dining', label: 'Dining' },
    { id: 'bookings', label: 'Bookings', count: confirmed.length },
  ];

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <Link to="/trips" className="small">← My trips</Link>
          <h1 style={{ marginTop: 6 }}>{t.destination}</h1>
          <div className="trip-meta">
            <span><Calendar width={14} height={14} /> {fmtRange(t.startDate, t.endDate)} · {nights} night{nights === 1 ? '' : 's'}</span>
            <span><Train width={14} height={14} /> {transportLabel(t.transportationType)}{t.distanceKm ? ` · ${t.distanceKm} km` : ''}</span>
            <span><Users width={14} height={14} /> {t.numberOfTravelers || 1} traveller{(t.numberOfTravelers || 1) === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="row">
          <Link to={`/trips/${id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
          <button type="button" className="btn btn-danger btn-sm" onClick={remove}><Trash width={14} height={14} /> Delete</button>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 26 }}>
        <div className="stat" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <EcoScore value={t.ecoScore} size={64} />
          <div><div className="label">Trip eco score</div><div className="small muted">Transport-based, 0–100</div></div>
        </div>
        <Stat label="Transport" value={(t.carbonFootprintKgCO2e || 0).toFixed(1)} unit="kg CO₂e" />
        <Stat label="Stays & meals" value={(summary?.carbonKgCO2e || 0).toFixed(1)} unit="kg CO₂e" />
        <Stat label="Total footprint" value={(t.totalCarbonFootprintKgCO2e ?? t.carbonFootprintKgCO2e ?? 0).toFixed(1)} unit="kg CO₂e" />
        <Stat label="Saved by eco bookings" value={(summary?.carbonSavedKgCO2e || 0).toFixed(1)} unit="kg CO₂e" tone="good" />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid two">
          <div className="card card-body stack">
            <h3 style={{ margin: 0 }}>About this trip</h3>
            {t.description ? <p style={{ margin: 0 }}>{t.description}</p> : <p className="muted" style={{ margin: 0 }}>No description yet.</p>}
            <dl className="kv">
              <dt>Accommodation</dt><dd>{t.accommodationType || 'Not decided'}</dd>
              <dt>Travellers</dt><dd>{(t.travelers || []).map((u) => u.name).join(', ') || t.createdBy?.name}</dd>
              {t.notes && <><dt>Notes</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{t.notes}</dd></>}
            </dl>
          </div>
          <div className="card card-body stack">
            <h3 style={{ margin: 0 }}>Destination coverage</h3>
            {destinations.loading && <Spinner />}
            {destinations.error && <ErrorBanner error={destinations.error} prefix="Booking service unavailable" />}
            {match ? (
              <>
                <p style={{ margin: 0 }}>The booking catalogue covers <strong>{match.city}, {match.country}</strong> with {match.hotels} eco-certified stay{match.hotels === 1 ? '' : 's'} and {match.restaurants} sustainable restaurant{match.restaurants === 1 ? '' : 's'}.</p>
                <div className="row">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('stays')}>Find a stay</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('dining')}>Find a table</button>
                </div>
              </>
            ) : destinations.data && (
              <p className="muted" style={{ margin: 0 }}>No catalogue venues match “{t.destination}” yet. Covered destinations: {destinations.data.map((d) => d.city).join(', ')}.</p>
            )}
            {summary && summary.confirmedCount > 0 && (
              <div className="banner success small">
                {summary.hotelNights > 0 && <>{summary.hotelNights} room-night{summary.hotelNights === 1 ? '' : 's'} booked</>}
                {summary.hotelNights > 0 && summary.restaurantCovers > 0 && ' · '}
                {summary.restaurantCovers > 0 && <>{summary.restaurantCovers} dinner cover{summary.restaurantCovers === 1 ? '' : 's'} reserved</>}
                {summary.totals.length > 0 && <> · {summary.totals.map((x) => `${x.amount} ${x.currency}`).join(' + ')}</>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stays' && (
        !city ? <EmptyState title="No stays in the catalogue for this destination">Try editing the destination to one of the covered cities.</EmptyState> : (
          <>
            <div className="small muted" style={{ marginBottom: 12 }}>Stays in {city} with availability for {stay.guests} guest{stay.guests === 1 ? '' : 's'}, {fmtRange(t.startDate, t.endDate)}.</div>
            <ErrorBanner error={hotels.error} prefix="Booking service unavailable" />
            {hotels.loading && <Spinner center />}
            {hotels.data && (hotels.data.items.length ? (
              <div className="grid">{hotels.data.items.map((h) => <HotelCard key={h.id} hotel={h} cta="Check rooms" onSelect={(venue) => setSelected({ kind: 'hotel', venue })} />)}</div>
            ) : <EmptyState title="Everything is booked for those dates">Adjust the dates or the number of travellers.</EmptyState>)}
          </>
        )
      )}

      {tab === 'dining' && (
        !city ? <EmptyState title="No restaurants in the catalogue for this destination">Try editing the destination to one of the covered cities.</EmptyState> : (
          <>
            <div className="small muted" style={{ marginBottom: 12 }}>Sustainable restaurants in {city}. Reservations default to the trip dates.</div>
            <ErrorBanner error={restaurants.error} prefix="Booking service unavailable" />
            {restaurants.loading && <Spinner center />}
            {restaurants.data && <div className="grid">{restaurants.data.items.map((r) => <RestaurantCard key={r.id} restaurant={r} onSelect={(venue) => setSelected({ kind: 'restaurant', venue })} />)}</div>}
          </>
        )
      )}

      {tab === 'bookings' && (
        (t.bookings || []).length ? (
          <div className="stack" style={{ gap: 10 }}>
            {t.bookings.map((b) => <BookingRow key={b.id} booking={b} onCancel={cancel} busy={cancelling === b.id} />)}
          </div>
        ) : (
          <EmptyState title="Nothing booked for this trip yet" action={<button type="button" className="btn btn-primary" onClick={() => setTab('stays')}>Find a stay</button>}>
            Bookings attached to the trip add to the footprint total above and show what they save.
          </EmptyState>
        )
      )}

      {selected?.kind === 'hotel' && (
        <HotelDetailModal hotel={selected.venue} lockedTrip={t} defaults={stay} onClose={() => setSelected(null)} onBooked={() => { trip.reload(); setSelected(null); setTab('bookings'); }} />
      )}
      {selected?.kind === 'restaurant' && (
        <RestaurantDetailModal restaurant={selected.venue} lockedTrip={t} defaults={{ date: stay.checkIn, partySize: stay.guests }} dateBounds={{ min: stay.checkIn, max: stay.checkOut }} onClose={() => setSelected(null)} onBooked={() => { trip.reload(); setSelected(null); setTab('bookings'); }} />
      )}
    </div>
  );
}
