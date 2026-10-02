/**
 * Catalogue filtering, expressed twice on purpose:
 *   - as a predicate (used by the in-memory repository and by tests),
 *   - as a MongoDB query builder (used by the Mongo repository).
 * Keeping both next to each other makes it easy to see that they encode the
 * same rules. Availability filters (dates, party size) are NOT handled here
 * because they depend on existing bookings; the services apply them.
 */

const ci = (value) => String(value).trim().toLowerCase();
const includesAll = (haystack = [], needles = []) => needles.every((n) => haystack.includes(n));
const textMatches = (venue, q) => {
  const needle = ci(q);
  return [venue.name, venue.city, venue.country, venue.description, ...(venue.cuisine || [])]
    .filter(Boolean)
    .some((field) => ci(field).includes(needle));
};

function hotelPredicate(q) {
  return (h) => {
    if (q.city && ci(h.city) !== ci(q.city)) return false;
    if (q.country && ci(h.country) !== ci(q.country)) return false;
    if (q.certifications && !includesAll(h.certifications, q.certifications)) return false;
    if (q.features && !includesAll(h.sustainabilityFeatures, q.features)) return false;
    if (q.minEcoScore !== undefined && h.ecoScore < q.minEcoScore) return false;
    if (q.minRating !== undefined && h.rating < q.minRating) return false;
    if (q.maxPrice !== undefined && h.lowestPricePerNight > q.maxPrice) return false;
    if (q.q && !textMatches(h, q.q)) return false;
    return true;
  };
}

function hotelMongoQuery(q) {
  const query = {};
  if (q.city) query.city = ciExact(q.city);
  if (q.country) query.country = ciExact(q.country);
  if (q.certifications) query.certifications = { $all: q.certifications };
  if (q.features) query.sustainabilityFeatures = { $all: q.features };
  if (q.minEcoScore !== undefined) query.ecoScore = { $gte: q.minEcoScore };
  if (q.minRating !== undefined) query.rating = { $gte: q.minRating };
  if (q.maxPrice !== undefined) query.lowestPricePerNight = { $lte: q.maxPrice };
  if (q.q) query.$or = textOr(q.q, ['name', 'city', 'country', 'description']);
  return query;
}

function restaurantPredicate(q) {
  return (r) => {
    if (q.city && ci(r.city) !== ci(q.city)) return false;
    if (q.country && ci(r.country) !== ci(q.country)) return false;
    if (q.cuisine && !r.cuisine.map(ci).includes(ci(q.cuisine))) return false;
    if (q.dietary && !includesAll(r.dietaryOptions, q.dietary)) return false;
    if (q.certifications && !includesAll(r.certifications, q.certifications)) return false;
    if (q.features && !includesAll(r.sustainabilityFeatures, q.features)) return false;
    if (q.maxPriceLevel !== undefined && r.priceLevel > q.maxPriceLevel) return false;
    if (q.minEcoScore !== undefined && r.ecoScore < q.minEcoScore) return false;
    if (q.minRating !== undefined && r.rating < q.minRating) return false;
    if (q.q && !textMatches(r, q.q)) return false;
    return true;
  };
}

function restaurantMongoQuery(q) {
  const query = {};
  if (q.city) query.city = ciExact(q.city);
  if (q.country) query.country = ciExact(q.country);
  if (q.cuisine) query.cuisine = ciExact(q.cuisine);
  if (q.dietary) query.dietaryOptions = { $all: q.dietary };
  if (q.certifications) query.certifications = { $all: q.certifications };
  if (q.features) query.sustainabilityFeatures = { $all: q.features };
  if (q.maxPriceLevel !== undefined) query.priceLevel = { $lte: q.maxPriceLevel };
  if (q.minEcoScore !== undefined) query.ecoScore = { $gte: q.minEcoScore };
  if (q.minRating !== undefined) query.rating = { $gte: q.minRating };
  if (q.q) query.$or = textOr(q.q, ['name', 'city', 'country', 'description', 'cuisine']);
  return query;
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ciExact = (value) => new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i');
const textOr = (q, fields) => {
  const re = new RegExp(escapeRegex(q), 'i');
  return fields.map((f) => ({ [f]: re }));
};

/** Sort comparators shared by both repositories (sorting happens in the service). */
const SORTERS = {
  ecoScore: (a, b) => b.ecoScore - a.ecoScore || b.rating - a.rating,
  rating: (a, b) => b.rating - a.rating || b.ecoScore - a.ecoScore,
  price: (a, b) => (a.lowestPricePerNight ?? a.priceLevel) - (b.lowestPricePerNight ?? b.priceLevel) || b.ecoScore - a.ecoScore,
  name: (a, b) => a.name.localeCompare(b.name),
};

module.exports = { hotelPredicate, hotelMongoQuery, restaurantPredicate, restaurantMongoQuery, SORTERS };
