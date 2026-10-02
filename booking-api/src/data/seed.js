const hotels = require('./hotels');
const restaurants = require('./restaurants');
const { computeVenueEcoScore, BASELINES } = require('../domain/ecoImpact');

/** Adds derived fields so the stored documents are self-contained for filtering. */
function prepareHotel(hotel) {
  const lowestPricePerNight = Math.min(...hotel.roomTypes.map((r) => r.pricePerNight));
  const ecoScore = computeVenueEcoScore({
    carbonKgPerUnit: hotel.carbonKgPerGuestNight,
    baselineKgPerUnit: BASELINES.HOTEL_KG_CO2E_PER_GUEST_NIGHT,
    certifications: hotel.certifications,
    features: hotel.sustainabilityFeatures,
  });
  return { ...hotel, lowestPricePerNight, ecoScore };
}

function prepareRestaurant(restaurant) {
  const ecoScore = computeVenueEcoScore({
    carbonKgPerUnit: restaurant.carbonKgPerCover,
    baselineKgPerUnit: BASELINES.MEAL_KG_CO2E_PER_COVER,
    certifications: restaurant.certifications,
    features: restaurant.sustainabilityFeatures,
  });
  return { ...restaurant, ecoScore };
}

function buildCatalog() {
  return {
    hotels: hotels.map(prepareHotel),
    restaurants: restaurants.map(prepareRestaurant),
  };
}

/**
 * Loads the sample catalogue. By default it only seeds when the catalogue is
 * empty so that restarting the service never clobbers curated data.
 */
async function seedCatalog(repos, { force = false, logger = console } = {}) {
  const existing = (await repos.hotels.count()) + (await repos.restaurants.count());
  if (existing > 0 && !force) {
    logger.log(`[seed] catalogue already has ${existing} venues, skipping`);
    return { seeded: false, hotels: 0, restaurants: 0 };
  }
  if (force) {
    await repos.hotels.clear();
    await repos.restaurants.clear();
  }
  const catalog = buildCatalog();
  const h = await repos.hotels.insertMany(catalog.hotels);
  const r = await repos.restaurants.insertMany(catalog.restaurants);
  logger.log(`[seed] loaded ${h} hotels and ${r} restaurants`);
  return { seeded: true, hotels: h, restaurants: r };
}

module.exports = { buildCatalog, prepareHotel, prepareRestaurant, seedCatalog };
