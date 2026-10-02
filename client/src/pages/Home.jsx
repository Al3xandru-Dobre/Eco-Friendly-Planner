import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/booking';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../lib/useAsync';
import { HotelCard, RestaurantCard } from '../components/VenueCard';
import { HotelDetailModal, RestaurantDetailModal } from '../components/booking/VenueDetail';
import { Spinner, ErrorBanner } from '../components/Primitives';
import { EcoScore } from '../components/EcoScore';
import { Arrow, Bed, Fork, Route } from '../components/Icons';

export function Home() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const featured = useAsync(() => Promise.all([
    bookingApi.hotels({ limit: 3, sort: 'ecoScore' }),
    bookingApi.restaurants({ limit: 3, sort: 'ecoScore' }),
    bookingApi.destinations(),
  ]).then(([h, r, d]) => ({ hotels: h.items, restaurants: r.items, destinations: d.items })), []);

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Plan · Stay · Eat, with the footprint in view</div>
            <h1>Travel lighter without planning harder.</h1>
            <p className="lede">Plan a trip, see the carbon of getting there, then book eco-certified stays and sustainable restaurants at the destination. Every booking shows what it saves against a conventional choice.</p>
            <div className="row" style={{ marginTop: 22 }}>
              <Link to={user ? '/trips/new' : '/register'} className="btn btn-primary btn-lg">{user ? 'Plan a trip' : 'Start planning'} <Arrow /></Link>
              <Link to="/explore" className="btn btn-ghost btn-lg">Browse stays & dining</Link>
            </div>
          </div>
          <div className="hero-card">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Example trip</div>
                <h3 style={{ margin: 0 }}>Bucharest → Brașov</h3>
                <div className="small muted">2 travellers · 3 nights · by train</div>
              </div>
              <EcoScore value={92} size={72} />
            </div>
            <dl className="kv">
              <dt>Train, 166 km each way</dt><dd className="mono">11.6 kg CO₂e</dd>
              <dt>Timber lodge, 3 nights</dt><dd className="mono">44.4 kg CO₂e <span className="faint tiny">(saves 75.6 kg)</span></dd>
              <dt>Two dinners for 2</dt><dd className="mono">6.2 kg CO₂e <span className="faint tiny">(saves 7.8 kg)</span></dd>
            </dl>
            <div className="divider" />
            <div className="row between small">
              <span className="muted">Same trip by petrol car, conventional hotel and restaurants</span>
              <strong className="mono">≈ 200 kg CO₂e</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="steps">
          <div className="step"><div className="num"><Route width={18} height={18} /></div><h4>Plan the journey</h4><p className="small muted" style={{ margin: 0 }}>Choose destination, dates and transport. The planner estimates the footprint per traveller and scores the trip.</p></div>
          <div className="step"><div className="num"><Bed width={18} height={18} /></div><h4>Book a certified stay</h4><p className="small muted" style={{ margin: 0 }}>Hotels carry recognised eco labels and a per-night carbon figure. Availability is live and priced per stay.</p></div>
          <div className="step"><div className="num"><Fork width={18} height={18} /></div><h4>Reserve sustainable tables</h4><p className="small muted" style={{ margin: 0 }}>Seasonal, local and plant-forward kitchens with dietary filters. Reservations attach to the trip's total.</p></div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div><div className="eyebrow">Highest eco scores</div><h2>Stays worth the detour</h2></div>
          <Link to="/explore?kind=hotels" className="btn btn-ghost btn-sm">All stays <Arrow width={14} height={14} /></Link>
        </div>
        <ErrorBanner error={featured.error} prefix="Booking service unavailable" />
        {featured.loading ? <Spinner center /> : (
          <div className="grid">{featured.data?.hotels.map((h) => <HotelCard key={h.id} hotel={h} onSelect={(hotel) => setSelected({ kind: 'hotel', venue: hotel })} />)}</div>
        )}
      </section>

      <section className="container section">
        <div className="section-head">
          <div><div className="eyebrow">Low-carbon kitchens</div><h2>Tables that source nearby</h2></div>
          <Link to="/explore?kind=restaurants" className="btn btn-ghost btn-sm">All dining <Arrow width={14} height={14} /></Link>
        </div>
        {featured.loading ? <Spinner center /> : (
          <div className="grid">{featured.data?.restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} onSelect={(venue) => setSelected({ kind: 'restaurant', venue })} />)}</div>
        )}
      </section>

      {featured.data?.destinations?.length > 0 && (
        <section className="container section">
          <div className="section-head"><div><div className="eyebrow">Destinations</div><h2>Where the catalogue reaches</h2></div></div>
          <div className="chips">
            {featured.data.destinations.map((d) => (
              <Link key={`${d.city}-${d.country}`} to={`/explore?city=${encodeURIComponent(d.city)}`} className="chip">{d.city} <span className="faint">{d.hotels + d.restaurants}</span></Link>
            ))}
          </div>
        </section>
      )}

      {selected?.kind === 'hotel' && <HotelDetailModal hotel={selected.venue} onClose={() => setSelected(null)} />}
      {selected?.kind === 'restaurant' && <RestaurantDetailModal restaurant={selected.venue} onClose={() => setSelected(null)} />}
    </div>
  );
}
