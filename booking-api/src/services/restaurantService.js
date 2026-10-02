const { restaurantFilter } = require('../domain/catalogFilters');
const { restaurantMealImpact } = require('../domain/ecoImpact');
const { RESTAURANT_SEATING_MINUTES, RESTAURANT_SLOT_MINUTES } = require('../domain/catalog');
const { notFound } = require('../utils/httpError');
const {
  csvList, optionalInt, optionalNumber, optionalString, requireDateOnly, requireTime, toDateOnly,
} = require('../utils/validate');
const { paginate } = require('./pagination');

const MINUTE_MS = 60 * 1000;

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Venue times are treated as "naive local" and stored as UTC instants on the
 * calendar date. The API never converts them to the caller's zone, which keeps
 * a 19:00 table at 19:00 regardless of where the guest books from.
 */
function slotInstant(dateOnly, hhmm) {
  return new Date(dateOnly.getTime() + toMinutes(hhmm) * MINUTE_MS);
}

/** All bookable start times for a given weekday, derived from opening hours. */
function slotsForDay(restaurant, weekday) {
  const slots = [];
  for (const period of restaurant.openingHours) {
    if (!period.days.includes(weekday)) continue;
    const open = toMinutes(period.open);
    const close = toMinutes(period.close);
    for (let t = open; t + RESTAURANT_SEATING_MINUTES <= close; t += RESTAURANT_SLOT_MINUTES) {
      slots.push(toHHMM(t));
    }
  }
  return [...new Set(slots)].sort();
}

function createRestaurantService({ repos }) {
  async function listRestaurants(rawQuery = {}) {
    const query = {
      city: optionalString(rawQuery.city, 'city'),
      country: optionalString(rawQuery.country, 'country'),
      cuisine: optionalString(rawQuery.cuisine, 'cuisine'),
      dietary: csvList(rawQuery.dietary),
      certifications: csvList(rawQuery.certification ?? rawQuery.certifications),
      features: csvList(rawQuery.feature ?? rawQuery.features),
      maxPriceLevel: optionalInt(rawQuery.maxPriceLevel, 'maxPriceLevel', { min: 1, max: 4 }),
      minEcoScore: optionalNumber(rawQuery.minEcoScore, 'minEcoScore', { min: 0, max: 100 }),
      minRating: optionalNumber(rawQuery.minRating, 'minRating', { min: 0, max: 5 }),
      q: optionalString(rawQuery.q, 'q', { maxLength: 100 }),
    };
    let restaurants = await repos.restaurants.findAll(restaurantFilter(query));

    let visit = null;
    if (rawQuery.date || rawQuery.time || rawQuery.partySize) {
      const date = requireDateOnly(rawQuery.date, 'date');
      const partySize = optionalInt(rawQuery.partySize, 'partySize', { min: 1, max: 30 }) ?? 2;
      const time = rawQuery.time ? requireTime(rawQuery.time, 'time') : undefined;
      visit = { date, partySize, time };
      const checked = await Promise.all(restaurants.map(async (restaurant) => {
        const slots = await slotAvailability(restaurant, visit);
        const open = slots.filter((s) => s.available && (!time || s.time === time));
        return open.length ? { ...restaurant, availability: open } : null;
      }));
      restaurants = checked.filter(Boolean);
    }

    return { ...paginate(restaurants, rawQuery), visit: visit && { ...visit, date: toDateOnly(visit.date) } };
  }

  async function getRestaurant(id) {
    const restaurant = await repos.restaurants.findById(id);
    if (!restaurant) throw notFound(`Restaurant "${id}" not found`);
    return restaurant;
  }

  /**
   * Seats are modelled as a single pool: a slot is available when the covers
   * of every confirmed booking overlapping its seating window, plus the new
   * party, fit within seatingCapacity. This is conservative (it ignores exact
   * table shapes) which is the right bias for a planner.
   */
  async function slotAvailability(restaurant, { date, partySize }) {
    const weekday = date.getUTCDay();
    const times = slotsForDay(restaurant, weekday);
    if (!times.length) return [];
    const dayStart = slotInstant(date, '00:00');
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * MINUTE_MS + RESTAURANT_SEATING_MINUTES * MINUTE_MS);
    const bookings = await repos.bookings.findRestaurantOverlaps({ restaurantId: restaurant.id, start: dayStart, end: dayEnd });
    return times.map((time) => {
      const start = slotInstant(date, time);
      const end = new Date(start.getTime() + RESTAURANT_SEATING_MINUTES * MINUTE_MS);
      const seated = bookings
        .filter((b) => b.restaurant.startsAt < end && b.restaurant.endsAt > start)
        .reduce((sum, b) => sum + b.restaurant.partySize, 0);
      const availableSeats = Math.max(0, restaurant.seatingCapacity - seated);
      return { time, availableSeats, available: availableSeats >= partySize };
    });
  }

  async function getAvailability(id, rawQuery) {
    const restaurant = await getRestaurant(id);
    const date = requireDateOnly(rawQuery.date, 'date');
    const partySize = optionalInt(rawQuery.partySize, 'partySize', { min: 1, max: 30 }) ?? 2;
    const slots = await slotAvailability(restaurant, { date, partySize });
    return {
      restaurant: { id: restaurant.id, name: restaurant.name, city: restaurant.city, currency: restaurant.currency },
      date: toDateOnly(date),
      partySize,
      open: slots.length > 0,
      seatingMinutes: RESTAURANT_SEATING_MINUTES,
      estimatedTotal: restaurant.averagePricePerCover * partySize,
      ecoImpact: restaurantMealImpact({ carbonKgPerCover: restaurant.carbonKgPerCover, partySize }),
      slots,
    };
  }

  return { listRestaurants, getRestaurant, getAvailability, slotAvailability, slotsForDay, slotInstant };
}

module.exports = { createRestaurantService, slotsForDay, slotInstant };
