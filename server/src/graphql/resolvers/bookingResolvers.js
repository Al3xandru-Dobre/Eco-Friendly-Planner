const { AuthenticationError, ApolloError } = require('apollo-server-express');
const bookingClient = require('../../services/bookingClient');

const authHeader = (context) => (context.req && context.req.headers.authorization) || '';

/** createdBy may be a populated document ({_id, id}) or a bare ObjectId/string. */
const ownerId = (createdBy) => String(createdBy?._id ?? createdBy?.id ?? createdBy ?? '');
const isOwner = (trip, context) => Boolean(context.user) && ownerId(trip.createdBy) === String(context.user.id);

/** Converts a booking API error into a GraphQL error without leaking stack traces. */
function translate(err) {
  if (err instanceof bookingClient.BookingApiError) {
    return new ApolloError(err.message, err.code, { status: err.status });
  }
  console.warn('[planner] booking API unreachable:', err.message);
  return new ApolloError('The booking service is currently unavailable', 'BOOKING_API_UNAVAILABLE');
}

/**
 * Field resolvers on Trip are deliberately tolerant: if the booking service is
 * down, the trip itself must still load. Only the explicit Query/Mutation
 * surface raises errors to the caller.
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
  Query: {
    myBookings: async (_, args, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in to view your bookings.');
      try {
        return await bookingClient.listBookings(authHeader(context), args);
      } catch (err) {
        throw translate(err);
      }
    },
  },
  Mutation: {
    cancelBooking: async (_, { bookingId }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in to cancel a booking.');
      try {
        return await bookingClient.cancelBooking(authHeader(context), bookingId);
      } catch (err) {
        throw translate(err);
      }
    },
  },
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
