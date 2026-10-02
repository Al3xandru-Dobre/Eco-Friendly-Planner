import { Link } from 'react-router-dom';
import { gql } from '../api/graphql';
import { MY_TRIPS } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../lib/useAsync';
import { fmtRange, kg, nightsBetween } from '../lib/format';
import { transportLabel } from '../lib/trips';
import { EcoScore } from '../components/EcoScore';
import { EmptyState, ErrorBanner, Spinner, Stat } from '../components/Primitives';
import { Bed, Calendar, Plus, Train, Users } from '../components/Icons';

export function Trips() {
  const { token, user } = useAuth();
  const { data, error, loading } = useAsync(() => gql(MY_TRIPS, {}, token).then((d) => d.getUserTrips || []), [token]);
  const trips = data || [];

  const totals = trips.reduce((acc, t) => ({
    transport: acc.transport + (t.carbonFootprintKgCO2e || 0),
    bookings: acc.bookings + (t.bookingSummary?.carbonKgCO2e || 0),
    saved: acc.saved + (t.bookingSummary?.carbonSavedKgCO2e || 0),
    count: acc.count + (t.bookingSummary?.confirmedCount || 0),
  }), { transport: 0, bookings: 0, saved: 0, count: 0 });

  return (
    <div className="container page">
      <div className="page-head">
        <div><div className="eyebrow">Hello, {user.name.split(' ')[0]}</div><h1>My trips</h1></div>
        <Link to="/trips/new" className="btn btn-primary"><Plus /> Plan a trip</Link>
      </div>

      {trips.length > 0 && (
        <div className="stats" style={{ marginBottom: 28 }}>
          <Stat label="Trips" value={trips.length} />
          <Stat label="Transport footprint" value={totals.transport.toFixed(1)} unit="kg CO₂e" />
          <Stat label="Stays & meals" value={totals.bookings.toFixed(1)} unit="kg CO₂e" />
          <Stat label="Saved by eco bookings" value={totals.saved.toFixed(1)} unit="kg CO₂e" tone="good" />
        </div>
      )}

      <ErrorBanner error={error} prefix="Could not load trips" />
      {loading && <Spinner center />}
      {!loading && !error && (trips.length ? (
        <div className="stack">
          {trips.map((t) => (
            <Link key={t.id} to={`/trips/${t.id}`} className="card card-hover card-body trip-card" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 10 }}>
                  <h3 className="card-title" style={{ margin: 0 }}>{t.destination}</h3>
                  {t.bookingSummary?.confirmedCount > 0 && <span className="badge badge-primary"><Bed width={12} height={12} /> {t.bookingSummary.confirmedCount} booking{t.bookingSummary.confirmedCount === 1 ? '' : 's'}</span>}
                </div>
                <div className="trip-meta">
                  <span><Calendar width={14} height={14} /> {fmtRange(t.startDate, t.endDate)} · {nightsBetween(t.startDate, t.endDate)} nights</span>
                  <span><Train width={14} height={14} /> {transportLabel(t.transportationType)}{t.distanceKm ? ` · ${t.distanceKm} km` : ''}</span>
                  <span><Users width={14} height={14} /> {t.numberOfTravelers || 1}</span>
                  <span className="mono">{kg(t.carbonFootprintKgCO2e)} CO₂e transport</span>
                </div>
                {t.description && <p className="small muted" style={{ margin: 0 }}>{t.description}</p>}
              </div>
              <EcoScore value={t.ecoScore} size={68} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No trips yet" action={<Link to="/trips/new" className="btn btn-primary">Plan your first trip</Link>}>
          Add a destination, dates and how you will get there. The planner estimates the footprint, and you can book stays and tables against it.
        </EmptyState>
      ))}
    </div>
  );
}
