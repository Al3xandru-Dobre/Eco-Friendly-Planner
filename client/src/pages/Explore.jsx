import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingApi } from '../api/booking';
import { useAsync } from '../lib/useAsync';
import { humanize } from '../lib/format';
import { HotelCard, RestaurantCard } from '../components/VenueCard';
import { HotelDetailModal, RestaurantDetailModal } from '../components/booking/VenueDetail';
import { EmptyState, ErrorBanner, Field, Spinner } from '../components/Primitives';
import { Segmented } from '../components/Tabs';

const SORTS = [
  { value: 'ecoScore', label: 'Eco score' },
  { value: 'rating', label: 'Guest rating' },
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
];

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function Explore() {
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') === 'restaurants' ? 'restaurants' : 'hotels';
  const city = params.get('city') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'ecoScore';
  const minEcoScore = Number(params.get('minEcoScore') || 0);
  const tags = (params.get('tags') || '').split(',').filter(Boolean);
  const [selected, setSelected] = useState(null);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v === null || v === undefined || v === 0 || (Array.isArray(v) && !v.length)) next.delete(k); else next.set(k, Array.isArray(v) ? v.join(',') : String(v)); });
    setParams(next, { replace: true });
  };

  const reference = useAsync(() => Promise.all([bookingApi.reference(), bookingApi.destinations()]).then(([ref, dest]) => ({ ref, destinations: dest.items })), []);

  const query = useMemo(() => {
    const base = { city, q, sort, minEcoScore: minEcoScore || undefined, limit: 60 };
    if (kind === 'hotels') return { ...base, certification: tags.join(',') || undefined };
    return { ...base, dietary: tags.join(',') || undefined };
  }, [kind, city, q, sort, minEcoScore, tags.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useAsync(() => (kind === 'hotels' ? bookingApi.hotels(query) : bookingApi.restaurants(query)), [kind, JSON.stringify(query)]);

  const tagOptions = kind === 'hotels' ? reference.data?.ref.hotelCertifications || [] : reference.data?.ref.dietaryOptions || [];

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Explore</div>
          <h1>{kind === 'hotels' ? 'Eco-certified stays' : 'Sustainable dining'}</h1>
          <p className="muted" style={{ margin: 0 }}>Filter by destination, label and eco score. Open a venue to check live availability.</p>
        </div>
        <Segmented value={kind} onChange={(v) => set({ kind: v, tags: [] })} options={[{ value: 'hotels', label: 'Stays' }, { value: 'restaurants', label: 'Dining' }]} />
      </div>

      <div className="card card-body stack" style={{ marginBottom: 24 }}>
        <div className="form-grid">
          <Field label="Destination" htmlFor="city">
            <select id="city" className="input" value={city} onChange={(e) => set({ city: e.target.value })}>
              <option value="">Anywhere</option>
              {reference.data?.destinations.map((d) => <option key={`${d.city}-${d.country}`} value={d.city}>{d.city}, {d.country}</option>)}
            </select>
          </Field>
          <Field label="Search" htmlFor="q"><input id="q" className="input" placeholder={kind === 'hotels' ? 'passive house, harbour…' : 'vegan, seafood, Nordic…'} value={q} onChange={(e) => set({ q: e.target.value })} /></Field>
          <Field label="Sort by" htmlFor="sort">
            <select id="sort" className="input" value={sort} onChange={(e) => set({ sort: e.target.value })}>{SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </Field>
          <Field label={`Minimum eco score: ${minEcoScore || 'any'}`} htmlFor="minEco">
            <input id="minEco" type="range" className="range" min={0} max={90} step={5} value={minEcoScore} onChange={(e) => set({ minEcoScore: Number(e.target.value) })} />
          </Field>
        </div>
        {tagOptions.length > 0 && (
          <div>
            <div className="tiny faint" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{kind === 'hotels' ? 'Certifications' : 'Dietary options'}</div>
            <div className="chips">
              {tagOptions.map((t) => <button key={t} type="button" className={`chip${tags.includes(t) ? ' active' : ''}`} onClick={() => set({ tags: toggleIn(tags, t) })}>{humanize(t)}</button>)}
            </div>
          </div>
        )}
      </div>

      <ErrorBanner error={results.error} prefix="Booking service unavailable" />
      {results.loading && <Spinner center />}
      {results.data && !results.loading && (
        results.data.items.length ? (
          <>
            <div className="small muted" style={{ marginBottom: 12 }}>{results.data.total} {kind === 'hotels' ? 'stays' : 'restaurants'}{city ? ` in ${city}` : ''}</div>
            <div className="grid">
              {results.data.items.map((v) => (kind === 'hotels'
                ? <HotelCard key={v.id} hotel={v} onSelect={(venue) => setSelected({ kind: 'hotel', venue })} />
                : <RestaurantCard key={v.id} restaurant={v} onSelect={(venue) => setSelected({ kind: 'restaurant', venue })} />))}
            </div>
          </>
        ) : (
          <EmptyState title="Nothing matches those filters">Loosen the eco score or clear a label. The catalogue currently covers {reference.data?.destinations.length ?? 'several'} destinations.</EmptyState>
        )
      )}

      {selected?.kind === 'hotel' && <HotelDetailModal hotel={selected.venue} onClose={() => setSelected(null)} />}
      {selected?.kind === 'restaurant' && <RestaurantDetailModal restaurant={selected.venue} onClose={() => setSelected(null)} />}
    </div>
  );
}
