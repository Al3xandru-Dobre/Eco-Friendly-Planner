const fmtCache = new Map();

export function money(amount, currency = 'EUR') {
  const key = currency;
  if (!fmtCache.has(key)) {
    fmtCache.set(key, new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }));
  }
  return fmtCache.get(key).format(amount);
}

/** Parses the planner's date strings (ISO or epoch-milliseconds as string). */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d+$/.test(String(value))) return new Date(Number(value));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dateOnly(value) {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : '';
}

export function fmtDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = toDate(value);
  return d ? d.toLocaleDateString(undefined, { timeZone: 'UTC', ...opts }) : '';
}

export function fmtRange(start, end) {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return '';
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  return `${fmtDate(a, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })} – ${fmtDate(b)}`;
}

export function nightsBetween(start, end) {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function addDays(dateStr, days) {
  const d = toDate(dateStr) || new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const today = () => new Date().toISOString().slice(0, 10);

export function kg(value, digits = 1) {
  if (value === null || value === undefined) return '–';
  return `${Number(value).toFixed(digits)} kg`;
}

/** GREEN_KEY -> "Green Key", EU_ECOLABEL -> "EU Ecolabel", etc. */
const LABELS = {
  EU_ECOLABEL: 'EU Ecolabel', LEED: 'LEED', BREEAM: 'BREEAM', EV_CHARGING: 'EV charging',
  MSC_CHAIN_OF_CUSTODY: 'MSC chain of custody', SUSTAINABLE_RESTAURANT_ASSOCIATION: 'Sustainable Restaurant Assoc.',
  GREEN_RESTAURANT_ASSOCIATION: 'Green Restaurant Assoc.', CAR_ELECTRIC: 'Electric car', CAR_HYBRID: 'Hybrid car',
  CAR_GASOLINE: 'Petrol car', NO_SINGLE_USE_PLASTIC: 'No single-use plastic', TAP_WATER_ONLY: 'Tap water only',
};
export function humanize(code) {
  if (!code) return '';
  if (LABELS[code]) return LABELS[code];
  const words = String(code).toLowerCase().split('_');
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ` ${words.slice(1).join(' ')}` : '');
}

export const PRICE_LEVELS = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
}

const stripDiacritics = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Matches a free-text trip destination ("Brasov, Romania", "Copenhagen") to a
 * catalogue destination. Tolerant of diacritics and of "City, Country" forms.
 */
export function matchDestination(destination, destinations = []) {
  if (!destination || !destinations.length) return null;
  const needle = stripDiacritics(destination);
  const parts = needle.split(/[,/|-]/).map((p) => p.trim()).filter(Boolean);
  return destinations.find((d) => {
    const city = stripDiacritics(d.city);
    return parts.some((p) => p === city) || needle.includes(city);
  }) || destinations.find((d) => parts.some((p) => stripDiacritics(d.city).includes(p) && p.length >= 4)) || null;
}

export function ecoTone(score) {
  if (score === null || score === undefined) return '';
  if (score >= 65) return '';
  if (score >= 40) return 'warn';
  return 'bad';
}
