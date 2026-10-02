/**
 * Catalogue filters, declared once with the FilterBuilder.
 *
 * Each function reads like the list of criteria it supports. Absent criteria
 * are skipped by the builder, and the resulting Specification works for both
 * the in-memory and the MongoDB repositories.
 *
 * Availability (dates, party size) is NOT a catalogue filter: it depends on
 * existing bookings, so the services apply it after this step.
 */
const { FilterBuilder } = require('./filters/FilterBuilder');

const HOTEL_TEXT_FIELDS = ['name', 'city', 'country', 'description'];
const RESTAURANT_TEXT_FIELDS = ['name', 'city', 'country', 'description', 'cuisine'];

function hotelFilter(q = {}) {
  return new FilterBuilder()
    .equalsIgnoreCase('city', q.city)
    .equalsIgnoreCase('country', q.country)
    .containsAll('certifications', q.certifications)
    .containsAll('sustainabilityFeatures', q.features)
    .atLeast('ecoScore', q.minEcoScore)
    .atLeast('rating', q.minRating)
    .atMost('lowestPricePerNight', q.maxPrice)
    .textSearch(HOTEL_TEXT_FIELDS, q.q)
    .build();
}

function restaurantFilter(q = {}) {
  return new FilterBuilder()
    .equalsIgnoreCase('city', q.city)
    .equalsIgnoreCase('country', q.country)
    .equalsIgnoreCase('cuisine', q.cuisine)
    .containsAll('dietaryOptions', q.dietary)
    .containsAll('certifications', q.certifications)
    .containsAll('sustainabilityFeatures', q.features)
    .atMost('priceLevel', q.maxPriceLevel)
    .atLeast('ecoScore', q.minEcoScore)
    .atLeast('rating', q.minRating)
    .textSearch(RESTAURANT_TEXT_FIELDS, q.q)
    .build();
}

/** Sort comparators shared by both repositories (sorting happens in the service). */
const SORTERS = {
  ecoScore: (a, b) => b.ecoScore - a.ecoScore || b.rating - a.rating,
  rating: (a, b) => b.rating - a.rating || b.ecoScore - a.ecoScore,
  price: (a, b) => (a.lowestPricePerNight ?? a.priceLevel) - (b.lowestPricePerNight ?? b.priceLevel) || b.ecoScore - a.ecoScore,
  name: (a, b) => a.name.localeCompare(b.name),
};

module.exports = { hotelFilter, restaurantFilter, SORTERS };
