import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingApi } from '../api/booking';
import { useAsync } from '../lib/useAsync';

/**
 * Logic for the Explore page. Owns the URL-backed filter state (kind, city, q,
 * sort, minEcoScore, tags), the reference/destinations lookup, the venue search
 * query and its results, the derived tag options, and the selected-venue modal
 * state. Returns a flat view-model plus intent-named actions so the page only
 * renders markup.
 */

export const SORTS = [
  { value: 'ecoScore', label: 'Eco score' },
  { value: 'rating', label: 'Guest rating' },
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
];

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function useExplore() {
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

  return {
    kind,
    city,
    q,
    sort,
    minEcoScore,
    tags,
    tagOptions,
    destinations: reference.data?.destinations,
    results: { data: results.data, error: results.error, loading: results.loading },
    selected,
    select: (selectedKind, venue) => setSelected({ kind: selectedKind, venue }),
    closeSelected: () => setSelected(null),
    setKind: (value) => set({ kind: value, tags: [] }),
    setCity: (value) => set({ city: value }),
    setQuery: (value) => set({ q: value }),
    setSort: (value) => set({ sort: value }),
    setMinEcoScore: (value) => set({ minEcoScore: Number(value) }),
    toggleTag: (tag) => set({ tags: toggleIn(tags, tag) }),
  };
}
