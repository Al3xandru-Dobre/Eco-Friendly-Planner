import { humanize } from '../lib/format';
import { HotelCard, RestaurantCard } from '../components/VenueCard';
import { HotelDetailModal, RestaurantDetailModal } from '../components/booking/VenueDetail';
import { EmptyState, ErrorBanner, Field, Spinner } from '../components/Primitives';
import { Segmented } from '../components/Tabs';
import { SORTS, useExplore } from '../hooks/useExplore';

export function Explore() {
  const {
    kind, city, q, sort, minEcoScore, tags, tagOptions, destinations, results,
    selected, select, closeSelected,
    setKind, setCity, setQuery, setSort, setMinEcoScore, toggleTag,
  } = useExplore();

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Explore</div>
          <h1>{kind === 'hotels' ? 'Eco-certified stays' : 'Sustainable dining'}</h1>
          <p className="muted" style={{ margin: 0 }}>Filter by destination, label and eco score. Open a venue to check live availability.</p>
        </div>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'hotels', label: 'Stays' }, { value: 'restaurants', label: 'Dining' }]} />
      </div>

      <div className="card card-body stack" style={{ marginBottom: 24 }}>
        <div className="form-grid">
          <Field label="Destination" htmlFor="city">
            <select id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Anywhere</option>
              {destinations?.map((d) => <option key={`${d.city}-${d.country}`} value={d.city}>{d.city}, {d.country}</option>)}
            </select>
          </Field>
          <Field label="Search" htmlFor="q"><input id="q" className="input" placeholder={kind === 'hotels' ? 'passive house, harbour…' : 'vegan, seafood, Nordic…'} value={q} onChange={(e) => setQuery(e.target.value)} /></Field>
          <Field label="Sort by" htmlFor="sort">
            <select id="sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </Field>
          <Field label={`Minimum eco score: ${minEcoScore || 'any'}`} htmlFor="minEco">
            <input id="minEco" type="range" className="range" min={0} max={90} step={5} value={minEcoScore} onChange={(e) => setMinEcoScore(Number(e.target.value))} />
          </Field>
        </div>
        {tagOptions.length > 0 && (
          <div>
            <div className="tiny faint" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{kind === 'hotels' ? 'Certifications' : 'Dietary options'}</div>
            <div className="chips">
              {tagOptions.map((t) => <button key={t} type="button" className={`chip${tags.includes(t) ? ' active' : ''}`} onClick={() => toggleTag(t)}>{humanize(t)}</button>)}
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
                ? <HotelCard key={v.id} hotel={v} onSelect={(venue) => select('hotel', venue)} />
                : <RestaurantCard key={v.id} restaurant={v} onSelect={(venue) => select('restaurant', venue)} />))}
            </div>
          </>
        ) : (
          <EmptyState title="Nothing matches those filters">Loosen the eco score or clear a label. The catalogue currently covers {destinations?.length ?? 'several'} destinations.</EmptyState>
        )
      )}

      {selected?.kind === 'hotel' && <HotelDetailModal hotel={selected.venue} onClose={closeSelected} />}
      {selected?.kind === 'restaurant' && <RestaurantDetailModal restaurant={selected.venue} onClose={closeSelected} />}
    </div>
  );
}
