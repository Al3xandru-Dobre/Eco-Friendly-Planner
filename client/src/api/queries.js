/**
 * GraphQL documents used by the client, and only those.
 *
 * Field fragments are module-private: they are building blocks, not API.
 * Every exported operation has at least one caller (see AuthContext, Trips,
 * TripForm, TripDetail, TripPicker). Bookings are read and written through
 * src/api/booking.js against the booking API, not through GraphQL.
 *
 * Data minimisation: request only fields the UI renders. Co-travellers'
 * emails, for example, are not requested.
 */
const USER_FIELDS = 'id name email createdAt';

const BOOKING_FIELDS = `
  id reference type status tripId notes createdAt cancelledAt
  venue { id name city country }
  hotel { hotelId roomTypeCode roomTypeName checkIn checkOut nights guests rooms }
  restaurant { restaurantId date time partySize }
  pricing { currency unitAmount units total }
  ecoImpact { carbonKgCO2e baselineKgCO2e carbonSavedKgCO2e savingsPercent }
`;

const TRIP_FIELDS = `
  id destination startDate endDate description transportationType accommodationType
  distanceKm numberOfTravelers carbonFootprintKgCO2e ecoScore ecoRating notes createdAt updatedAt
  createdBy { id name }
  travelers { id name }
`;

const TRIP_WITH_BOOKINGS = `
  ${TRIP_FIELDS}
  totalCarbonFootprintKgCO2e
  bookingSummary { count confirmedCount cancelledCount hotelNights restaurantCovers carbonKgCO2e baselineKgCO2e carbonSavedKgCO2e totals { currency amount } }
  bookings { ${BOOKING_FIELDS} }
`;

export const REGISTER = `
  mutation Register($input: RegisterInput!) {
    registerUser(registerInput: $input) { token user { ${USER_FIELDS} } }
  }`;

export const LOGIN = `
  mutation Login($input: LoginInput!) {
    loginUser(loginInput: $input) { token user { ${USER_FIELDS} } }
  }`;

export const CURRENT_USER = `query Me { getCurrentUser { ${USER_FIELDS} } }`;

export const MY_TRIPS = `query MyTrips { getUserTrips { ${TRIP_FIELDS} bookingSummary { confirmedCount carbonKgCO2e carbonSavedKgCO2e } } }`;

export const TRIP = `query Trip($id: ID!) { getTrip(tripId: $id) { ${TRIP_WITH_BOOKINGS} } }`;

export const CREATE_TRIP = `
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(createTripInput: $input) { ${TRIP_FIELDS} }
  }`;

export const UPDATE_TRIP = `
  mutation UpdateTrip($id: ID!, $input: UpdateTripInput!) {
    updateTrip(tripId: $id, updateTripInput: $input) { ${TRIP_FIELDS} }
  }`;

export const DELETE_TRIP = `mutation DeleteTrip($id: ID!) { deleteTrip(tripId: $id) }`;
