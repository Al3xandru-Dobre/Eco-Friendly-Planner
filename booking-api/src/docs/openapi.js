/**
 * OpenAPI 3.0 description of the booking API, served at /api/v1/openapi.json
 * and rendered at /api/v1/docs. It is written by hand so that it stays a
 * contract rather than an afterthought generated from code.
 */
const ecoImpact = {
  type: 'object',
  properties: {
    carbonKgCO2e: { type: 'number', description: 'Estimated emissions for this booking' },
    baselineKgCO2e: { type: 'number', description: 'Emissions of a conventional equivalent' },
    carbonSavedKgCO2e: { type: 'number' },
    savingsPercent: { type: 'integer' },
  },
};

const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const bearer = [{ bearerAuth: [] }];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Eco-Friendly Planner Booking API',
    version: '1.0.0',
    description: 'Eco-certified stays, sustainable dining, availability checks and reservations. Authenticate with the planner\'s JWT (Authorization: Bearer <token>).',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Hotels' }, { name: 'Restaurants' }, { name: 'Bookings' }, { name: 'Catalogue' },
  ],
  paths: {
    '/hotels': {
      get: {
        tags: ['Hotels'],
        summary: 'Search eco-certified hotels',
        parameters: [
          q('city'), q('country'), q('q', 'Free-text search over name, city, country, description'),
          q('certification', 'Comma-separated HotelCertification values (all must match)'),
          q('feature', 'Comma-separated HotelFeature values (all must match)'),
          q('minEcoScore', '0-100'), q('minRating', '0-5'), q('maxPrice', 'Lowest nightly rate at or below this'),
          q('checkIn', 'YYYY-MM-DD; with checkOut, filters to hotels with availability'), q('checkOut', 'YYYY-MM-DD'),
          q('guests'), q('rooms'), q('sort', 'ecoScore | rating | price | name'), q('page'), q('limit'),
        ],
        responses: { 200: { description: 'Paged hotels', content: { 'application/json': { schema: { $ref: '#/components/schemas/HotelPage' } } } }, 400: errorResponse('Invalid query') },
      },
    },
    '/hotels/{id}': {
      get: {
        tags: ['Hotels'], summary: 'Hotel details', parameters: [p('id')],
        responses: { 200: { description: 'Hotel', content: { 'application/json': { schema: { $ref: '#/components/schemas/Hotel' } } } }, 404: errorResponse('Unknown hotel') },
      },
    },
    '/hotels/{id}/availability': {
      get: {
        tags: ['Hotels'], summary: 'Room availability, price and eco impact for a stay',
        parameters: [p('id'), q('checkIn', 'YYYY-MM-DD', true), q('checkOut', 'YYYY-MM-DD', true), q('guests'), q('rooms')],
        responses: { 200: { description: 'Availability per room type', content: { 'application/json': { schema: { $ref: '#/components/schemas/HotelAvailability' } } } }, 400: errorResponse('Invalid stay window'), 404: errorResponse('Unknown hotel') },
      },
    },
    '/restaurants': {
      get: {
        tags: ['Restaurants'], summary: 'Search sustainable restaurants',
        parameters: [
          q('city'), q('country'), q('q'), q('cuisine'), q('dietary', 'Comma-separated DietaryOption values'),
          q('certification'), q('feature'), q('maxPriceLevel', '1-4'), q('minEcoScore'), q('minRating'),
          q('date', 'YYYY-MM-DD; filters to restaurants with a free slot'), q('time', 'HH:MM; requires date'), q('partySize'),
          q('sort', 'ecoScore | rating | price | name'), q('page'), q('limit'),
        ],
        responses: { 200: { description: 'Paged restaurants', content: { 'application/json': { schema: { $ref: '#/components/schemas/RestaurantPage' } } } }, 400: errorResponse('Invalid query') },
      },
    },
    '/restaurants/{id}': {
      get: {
        tags: ['Restaurants'], summary: 'Restaurant details', parameters: [p('id')],
        responses: { 200: { description: 'Restaurant', content: { 'application/json': { schema: { $ref: '#/components/schemas/Restaurant' } } } }, 404: errorResponse('Unknown restaurant') },
      },
    },
    '/restaurants/{id}/availability': {
      get: {
        tags: ['Restaurants'], summary: 'Bookable time slots for a date',
        parameters: [p('id'), q('date', 'YYYY-MM-DD', true), q('partySize')],
        responses: { 200: { description: 'Slots', content: { 'application/json': { schema: { $ref: '#/components/schemas/RestaurantAvailability' } } } }, 400: errorResponse('Invalid date'), 404: errorResponse('Unknown restaurant') },
      },
    },
    '/bookings': {
      get: {
        tags: ['Bookings'], summary: 'List my bookings', security: bearer,
        parameters: [q('tripId'), q('status', 'CONFIRMED | CANCELLED'), q('type', 'HOTEL | RESTAURANT')],
        responses: { 200: { description: 'Bookings', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Booking' } }, total: { type: 'integer' } } } } } }, 401: errorResponse('Missing or invalid token') },
      },
    },
    '/bookings/summary': {
      get: {
        tags: ['Bookings'], summary: 'Cost and carbon totals for my bookings (optionally one trip)', security: bearer,
        parameters: [q('tripId')],
        responses: { 200: { description: 'Summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingSummary' } } } }, 401: errorResponse('Missing or invalid token') },
      },
    },
    '/bookings/hotels': {
      post: {
        tags: ['Bookings'], summary: 'Book a hotel room', security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HotelBookingRequest' } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, 400: errorResponse('Validation error'), 401: errorResponse('Missing or invalid token'), 404: errorResponse('Unknown hotel'), 409: errorResponse('No rooms left') },
      },
    },
    '/bookings/restaurants': {
      post: {
        tags: ['Bookings'], summary: 'Reserve a restaurant table', security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RestaurantBookingRequest' } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, 400: errorResponse('Validation error'), 401: errorResponse('Missing or invalid token'), 404: errorResponse('Unknown restaurant'), 409: errorResponse('No seats left') },
      },
    },
    '/bookings/{id}': {
      get: {
        tags: ['Bookings'], summary: 'Booking details', security: bearer, parameters: [p('id')],
        responses: { 200: { description: 'Booking', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, 401: errorResponse('Missing or invalid token'), 403: errorResponse('Not the owner'), 404: errorResponse('Unknown booking') },
      },
      delete: {
        tags: ['Bookings'], summary: 'Cancel a booking (idempotent)', security: bearer, parameters: [p('id')],
        responses: { 200: { description: 'Cancelled booking', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, 401: errorResponse('Missing or invalid token'), 403: errorResponse('Not the owner'), 404: errorResponse('Unknown booking') },
      },
    },
    '/destinations': {
      get: { tags: ['Catalogue'], summary: 'Cities with venue counts', responses: { 200: { description: 'Destinations' } } },
    },
    '/reference': {
      get: { tags: ['Catalogue'], summary: 'Enumerations and eco baselines used by the API', responses: { 200: { description: 'Reference data' } } },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: { type: 'object' } } } } },
      EcoImpact: ecoImpact,
      RoomType: { type: 'object', properties: { code: { type: 'string' }, name: { type: 'string' }, capacity: { type: 'integer' }, totalRooms: { type: 'integer' }, pricePerNight: { type: 'number' } } },
      Hotel: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, city: { type: 'string' }, country: { type: 'string' }, address: { type: 'string' },
          description: { type: 'string' }, highlights: { type: 'array', items: { type: 'string' } }, currency: { type: 'string' },
          lowestPricePerNight: { type: 'number' }, rating: { type: 'number' }, ecoScore: { type: 'integer' },
          certifications: { type: 'array', items: { type: 'string' } }, sustainabilityFeatures: { type: 'array', items: { type: 'string' } },
          roomTypes: { type: 'array', items: { $ref: '#/components/schemas/RoomType' } }, carbonKgPerGuestNight: { type: 'number' },
        },
      },
      HotelPage: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Hotel' } }, page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' }, sort: { type: 'string' } } },
      HotelAvailability: {
        type: 'object',
        properties: {
          checkIn: { type: 'string' }, checkOut: { type: 'string' }, nights: { type: 'integer' }, guests: { type: 'integer' }, rooms: { type: 'integer' },
          roomTypes: { type: 'array', items: { allOf: [{ $ref: '#/components/schemas/RoomType' }, { type: 'object', properties: { availableRooms: { type: 'integer' }, fitsParty: { type: 'boolean' }, available: { type: 'boolean' }, total: { type: 'number' }, ecoImpact } }] } },
        },
      },
      Restaurant: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, city: { type: 'string' }, country: { type: 'string' }, description: { type: 'string' },
          cuisine: { type: 'array', items: { type: 'string' } }, dietaryOptions: { type: 'array', items: { type: 'string' } },
          priceLevel: { type: 'integer' }, currency: { type: 'string' }, averagePricePerCover: { type: 'number' }, rating: { type: 'number' }, ecoScore: { type: 'integer' },
          certifications: { type: 'array', items: { type: 'string' } }, sustainabilityFeatures: { type: 'array', items: { type: 'string' } },
          seatingCapacity: { type: 'integer' }, openingHours: { type: 'array', items: { type: 'object', properties: { days: { type: 'array', items: { type: 'integer' } }, open: { type: 'string' }, close: { type: 'string' } } } },
          carbonKgPerCover: { type: 'number' },
        },
      },
      RestaurantPage: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Restaurant' } }, page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } } },
      RestaurantAvailability: { type: 'object', properties: { date: { type: 'string' }, partySize: { type: 'integer' }, open: { type: 'boolean' }, estimatedTotal: { type: 'number' }, ecoImpact, slots: { type: 'array', items: { type: 'object', properties: { time: { type: 'string' }, availableSeats: { type: 'integer' }, available: { type: 'boolean' } } } } } },
      HotelBookingRequest: {
        type: 'object', required: ['hotelId', 'roomTypeCode', 'checkIn', 'checkOut'],
        properties: { hotelId: { type: 'string' }, roomTypeCode: { type: 'string' }, checkIn: { type: 'string', example: '2026-06-10' }, checkOut: { type: 'string', example: '2026-06-13' }, guests: { type: 'integer', default: 1 }, rooms: { type: 'integer', default: 1 }, tripId: { type: 'string' }, notes: { type: 'string' } },
      },
      RestaurantBookingRequest: {
        type: 'object', required: ['restaurantId', 'date', 'time', 'partySize'],
        properties: { restaurantId: { type: 'string' }, date: { type: 'string', example: '2026-06-11' }, time: { type: 'string', example: '19:30' }, partySize: { type: 'integer' }, tripId: { type: 'string' }, notes: { type: 'string' } },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string' }, reference: { type: 'string' }, type: { type: 'string', enum: ['HOTEL', 'RESTAURANT'] }, status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] },
          tripId: { type: 'string', nullable: true }, venue: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, city: { type: 'string' }, country: { type: 'string' } } },
          hotel: { type: 'object', properties: { hotelId: { type: 'string' }, roomTypeCode: { type: 'string' }, roomTypeName: { type: 'string' }, checkIn: { type: 'string' }, checkOut: { type: 'string' }, nights: { type: 'integer' }, guests: { type: 'integer' }, rooms: { type: 'integer' } } },
          restaurant: { type: 'object', properties: { restaurantId: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, partySize: { type: 'integer' } } },
          pricing: { type: 'object', properties: { currency: { type: 'string' }, unitAmount: { type: 'number' }, units: { type: 'integer' }, total: { type: 'number' } } },
          ecoImpact, notes: { type: 'string', nullable: true }, createdAt: { type: 'string' }, cancelledAt: { type: 'string', nullable: true },
        },
      },
      BookingSummary: {
        type: 'object',
        properties: {
          tripId: { type: 'string', nullable: true }, count: { type: 'integer' }, confirmedCount: { type: 'integer' }, cancelledCount: { type: 'integer' },
          hotelNights: { type: 'integer' }, restaurantCovers: { type: 'integer' }, totalsByCurrency: { type: 'object', additionalProperties: { type: 'number' } },
          carbonKgCO2e: { type: 'number' }, baselineKgCO2e: { type: 'number' }, carbonSavedKgCO2e: { type: 'number' },
        },
      },
    },
  },
};

function q(name, description, required = false) {
  return { name, in: 'query', required, schema: { type: 'string' }, ...(description ? { description } : {}) };
}
function p(name) {
  return { name, in: 'path', required: true, schema: { type: 'string' } };
}
