const bookingClient = require('../../services/bookingClient');

const authHeader = (context) => (context.req && context.req.headers.authorization) || '';

/** createdBy may be a populated document ({_id, id}) or a bare ObjectId/string. */
const ownerId = (createdBy) => String(createdBy?._id ?? createdBy?.id ?? createdBy ?? '');
const isOwner = (trip, context) => Boolean(context.user) && ownerId(trip.createdBy) === String(context.user.id);

/**
 * Field resolvers on Trip are deliberately tolerant: if the booking service is
 * down, the trip itself must still load, so failures degrade to empty values
 * and a logged warning. Booking data is shown to the trip owner only.
 */
async function tripBookings(trip, { status }, context) {
  if (!isOwner(trip, context)) return [];
  try {
    return await bookingClient.listBookings(authHeader(context), { tripId: trip.id, status });
  } catch (err) {
    console.warn(`[planner] could not load bookings for trip ${trip.id}:`, err.message);
    return [];
  }
}

async function tripSummary(trip, _args, context) {
  if (!isOwner(trip, context)) return null;
  try {
    const s = await bookingClient.getSummary(authHeader(context), { tripId: trip.id });
    return {
      ...s,
      totals: Object.entries(s.totalsByCurrency || {}).map(([currency, amount]) => ({ currency, amount })),
    };
  } catch (err) {
    console.warn(`[planner] could not load booking summary for trip ${trip.id}:`, err.message);
    return null;
  }
}

module.exports = {
  Trip: {
    bookings: tripBookings,
    bookingSummary: tripSummary,
    totalCarbonFootprintKgCO2e: async (trip, _args, context) => {
      const transport = trip.carbonFootprintKgCO2e || 0;
      const summary = await tripSummary(trip, _args, context);
      return Math.round((transport + (summary ? summary.carbonKgCO2e : 0)) * 10) / 10;
    },
  },
};
