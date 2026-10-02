import { Link } from 'react-router-dom';
import { useMyTrips } from '../../hooks/useMyTrips';
import { fmtRange } from '../../lib/format';
import { Field } from '../Primitives';

/** Lets a traveller attach a booking to one of their trips. */
export function TripPicker({ value, onChange, lockedTrip }) {
  const { trips, loading } = useMyTrips({ enabled: !lockedTrip });

  if (lockedTrip) {
    return (
      <Field label="Trip">
        <div className="input" style={{ background: 'var(--surface-2)' }}>{lockedTrip.destination} · {fmtRange(lockedTrip.startDate, lockedTrip.endDate)}</div>
      </Field>
    );
  }
  return (
    <Field label="Attach to a trip" hint={!loading && !trips.length ? undefined : 'Optional. Attached bookings count toward the trip footprint.'}>
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value || null)} disabled={loading}>
        <option value="">No trip (standalone booking)</option>
        {trips.map((t) => <option key={t.id} value={t.id}>{t.destination} · {fmtRange(t.startDate, t.endDate)}</option>)}
      </select>
      {!loading && !trips.length && <span className="hint">You have no trips yet. <Link to="/trips/new">Plan one</Link> to track stays and meals against it.</span>}
    </Field>
  );
}
