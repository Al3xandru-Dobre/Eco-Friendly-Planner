const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const catalog = require('../domain/catalog');
const { BASELINES } = require('../domain/ecoImpact');

/** Reference data the client uses to build filters and match trip destinations. */
function catalogRoutes({ repos }) {
  const router = Router();

  router.get('/destinations', asyncHandler(async (_req, res) => {
    const [hotels, restaurants] = await Promise.all([repos.hotels.findAll(), repos.restaurants.findAll()]);
    const byCity = new Map();
    const bump = (venue, key) => {
      const id = `${venue.city}|${venue.country}`;
      const entry = byCity.get(id) || { city: venue.city, country: venue.country, hotels: 0, restaurants: 0, coordinates: venue.coordinates };
      entry[key] += 1;
      byCity.set(id, entry);
    };
    hotels.forEach((h) => bump(h, 'hotels'));
    restaurants.forEach((r) => bump(r, 'restaurants'));
    const items = [...byCity.values()].sort((a, b) => a.city.localeCompare(b.city));
    res.json({ items, total: items.length });
  }));

  router.get('/reference', (_req, res) => {
    res.json({
      hotelCertifications: catalog.HOTEL_CERTIFICATIONS,
      hotelFeatures: catalog.HOTEL_FEATURES,
      restaurantCertifications: catalog.RESTAURANT_CERTIFICATIONS,
      restaurantFeatures: catalog.RESTAURANT_FEATURES,
      dietaryOptions: catalog.DIETARY_OPTIONS,
      bookingTypes: catalog.BOOKING_TYPES,
      bookingStatuses: catalog.BOOKING_STATUSES,
      restaurantSeatingMinutes: catalog.RESTAURANT_SEATING_MINUTES,
      baselines: BASELINES,
    });
  });

  return router;
}

module.exports = { catalogRoutes };
