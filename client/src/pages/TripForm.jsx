import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { gql } from '../api/graphql';
import { CREATE_TRIP, TRIP, UPDATE_TRIP } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../lib/useAsync';
import { addDays, dateOnly, today } from '../lib/format';
import { ACCOMMODATION_OPTIONS, TRANSPORT_OPTIONS } from '../lib/trips';
import { ErrorBanner, Field, Spinner } from '../components/Primitives';

const empty = () => ({
  destination: '', startDate: addDays(today(), 14), endDate: addDays(today(), 17), description: '',
  transportationType: 'TRAIN', distanceKm: '', numberOfTravelers: 2, accommodationType: 'Eco-certified hotel', notes: '',
});

function fromTrip(t) {
  return {
    destination: t.destination, startDate: dateOnly(t.startDate), endDate: dateOnly(t.endDate), description: t.description || '',
    transportationType: t.transportationType || 'TRAIN', distanceKm: t.distanceKm ?? '', numberOfTravelers: t.numberOfTravelers || 1,
    accommodationType: t.accommodationType || '', notes: t.notes || '',
  };
}

function TripFields({ form, setForm, onSubmit, busy, error, submitLabel }) {
  const transport = TRANSPORT_OPTIONS.find((t) => t.value === form.transportationType);
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form className="card card-body stack" style={{ gap: 20 }} onSubmit={onSubmit}>
      <Field label="Destination" htmlFor="destination" hint="City and country, e.g. “Brașov, Romania”. Used to match stays and restaurants in the catalogue.">
        <input id="destination" className="input" required value={form.destination} onChange={upd('destination')} placeholder="Copenhagen, Denmark" />
      </Field>
      <div className="form-grid">
        <Field label="Start" htmlFor="startDate"><input id="startDate" type="date" className="input" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate <= e.target.value ? addDays(e.target.value, 1) : form.endDate })} /></Field>
        <Field label="End" htmlFor="endDate"><input id="endDate" type="date" className="input" required min={addDays(form.startDate, 1)} value={form.endDate} onChange={upd('endDate')} /></Field>
        <Field label="Travellers" htmlFor="numberOfTravelers"><input id="numberOfTravelers" type="number" min={1} max={20} className="input" value={form.numberOfTravelers} onChange={upd('numberOfTravelers')} /></Field>
      </div>
      <div className="form-grid">
        <Field label="Getting there" htmlFor="transportationType" hint={transport?.hint}>
          <select id="transportationType" className="input" value={form.transportationType} onChange={upd('transportationType')}>
            {TRANSPORT_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Distance (km, round trip)" htmlFor="distanceKm" hint="Drives the carbon estimate. Car emissions are shared between travellers.">
          <input id="distanceKm" type="number" min={0} step="1" className="input" value={form.distanceKm} onChange={upd('distanceKm')} placeholder="e.g. 340" />
        </Field>
        <Field label="Accommodation" htmlFor="accommodationType">
          <select id="accommodationType" className="input" value={form.accommodationType} onChange={upd('accommodationType')}>
            <option value="">Not decided</option>
            {ACCOMMODATION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description" htmlFor="description"><input id="description" className="input" value={form.description} onChange={upd('description')} placeholder="Long weekend in the mountains" /></Field>
      <Field label="Notes" htmlFor="notes"><textarea id="notes" className="input" value={form.notes} onChange={upd('notes')} placeholder="Packing list, who books what, train times…" /></Field>
      <ErrorBanner error={error} />
      <div className="form-actions">
        <Link to="/trips" className="btn btn-ghost">Cancel</Link>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}

function toInput(form) {
  return {
    destination: form.destination.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    description: form.description || undefined,
    transportationType: form.transportationType || undefined,
    distanceKm: form.distanceKm === '' ? undefined : Number(form.distanceKm),
    numberOfTravelers: Number(form.numberOfTravelers) || 1,
    accommodationType: form.accommodationType || undefined,
    notes: form.notes || undefined,
  };
}

export function TripNew() {
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const data = await gql(CREATE_TRIP, { input: toInput(form) }, token);
      toast.success('Trip created', `${data.createTrip.destination} · eco score ${data.createTrip.ecoScore}`);
      navigate(`/trips/${data.createTrip.id}`);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="page-head"><div><div className="eyebrow">New trip</div><h1>Where to?</h1></div></div>
      <TripFields form={form} setForm={setForm} onSubmit={submit} busy={busy} error={error} submitLabel="Create trip" />
    </div>
  );
}

export function TripEdit() {
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const trip = useAsync(() => gql(TRIP, { id }, token).then((d) => { setForm(fromTrip(d.getTrip)); return d.getTrip; }), [id, token]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await gql(UPDATE_TRIP, { id, input: toInput(form) }, token);
      toast.success('Trip updated');
      navigate(`/trips/${id}`);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  if (trip.loading || !form) return <div className="container page"><Spinner center /></div>;
  if (trip.error) return <div className="container page"><ErrorBanner error={trip.error} /></div>;
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="page-head"><div><div className="eyebrow">Edit trip</div><h1>{trip.data.destination}</h1></div></div>
      <TripFields form={form} setForm={setForm} onSubmit={submit} busy={busy} error={error} submitLabel="Save changes" />
    </div>
  );
}
