/**
 * Eco-impact model for stays and meals.
 *
 * The numbers below are INDICATIVE ASSUMPTIONS used to make the trade-offs in
 * the app visible, in the same spirit as the planner's transport emission
 * factors. They are not measured data for any specific venue and should be
 * replaced with audited figures (e.g. a venue's own carbon report) when they
 * become available. Keeping them in one place makes that replacement trivial.
 */
const BASELINES = Object.freeze({
  // A conventional hotel room-night, per guest.
  HOTEL_KG_CO2E_PER_GUEST_NIGHT: 20,
  // A conventional restaurant meal, per cover.
  MEAL_KG_CO2E_PER_COVER: 3.5,
});

const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function impact(actualPerUnit, baselinePerUnit, units) {
  const carbonKgCO2e = round1(actualPerUnit * units);
  const baselineKgCO2e = round1(baselinePerUnit * units);
  const carbonSavedKgCO2e = round1(Math.max(0, baselineKgCO2e - carbonKgCO2e));
  const savingsPercent = baselineKgCO2e > 0 ? Math.round((carbonSavedKgCO2e / baselineKgCO2e) * 100) : 0;
  return { carbonKgCO2e, baselineKgCO2e, carbonSavedKgCO2e, savingsPercent };
}

/** Impact of a hotel stay: guests x nights, compared with the conventional baseline. */
function hotelStayImpact({ carbonKgPerGuestNight, guests, nights, rooms = 1 }) {
  // One booking may cover several rooms; the per-guest factor already includes
  // the room share, so rooms only matter through the number of guests.
  void rooms;
  return impact(carbonKgPerGuestNight, BASELINES.HOTEL_KG_CO2E_PER_GUEST_NIGHT, guests * nights);
}

/** Impact of a restaurant reservation: one meal per cover. */
function restaurantMealImpact({ carbonKgPerCover, partySize }) {
  return impact(carbonKgPerCover, BASELINES.MEAL_KG_CO2E_PER_COVER, partySize);
}

/**
 * Venue eco score, 0-100, built from three transparent components:
 *   - up to 60 points for carbon intensity below the baseline (linear),
 *   - up to 24 points for recognised certifications (8 each, max 3),
 *   - up to 16 points for sustainability features (2 each, max 8).
 * The weights favour measurable carbon reduction over self-declared features.
 */
function computeVenueEcoScore({ carbonKgPerUnit, baselineKgPerUnit, certifications = [], features = [] }) {
  const carbonRatio = baselinePerUnitSafe(baselineKgPerUnit) ? carbonKgPerUnit / baselineKgPerUnit : 1;
  const carbonPoints = clamp(1 - carbonRatio, 0, 1) * 60;
  const certificationPoints = Math.min(certifications.length, 3) * 8;
  const featurePoints = Math.min(features.length, 8) * 2;
  return Math.round(clamp(carbonPoints + certificationPoints + featurePoints, 0, 100));
}

function baselinePerUnitSafe(value) {
  return typeof value === 'number' && value > 0;
}

module.exports = {
  BASELINES,
  hotelStayImpact,
  restaurantMealImpact,
  computeVenueEcoScore,
};
