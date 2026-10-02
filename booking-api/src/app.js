const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createAuthMiddleware } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { createHotelService } = require('./services/hotelService');
const { createRestaurantService } = require('./services/restaurantService');
const { createBookingService } = require('./services/bookingService');
const { hotelRoutes } = require('./routes/hotels');
const { restaurantRoutes } = require('./routes/restaurants');
const { bookingRoutes } = require('./routes/bookings');
const { catalogRoutes } = require('./routes/catalog');
const openapi = require('./docs/openapi');

const DOCS_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Eco Booking API docs</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0"><redoc spec-url="./openapi.json"></redoc>
<script src="https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"></script></body></html>`;

/**
 * Application factory. Wiring happens here and nowhere else: repositories are
 * injected, services are composed from them, routes are composed from services.
 * Tests call this with in-memory repositories; index.js calls it with Mongo.
 */
function createApp({ repos, config }) {
  const { requireAuth } = createAuthMiddleware({ jwtSecret: config.jwtSecret });
  const hotelService = createHotelService({ repos });
  const restaurantService = createRestaurantService({ repos });
  const bookingService = createBookingService({ repos, hotelService, restaurantService });

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    res.json({
      status: 'ok',
      service: 'eco-booking-api',
      driver: repos.driver,
      catalogue: { hotels: await repos.hotels.count(), restaurants: await repos.restaurants.count() },
      time: new Date().toISOString(),
    });
  });

  const api = express.Router();
  api.get('/openapi.json', (_req, res) => res.json(openapi));
  api.get('/docs', (_req, res) => res.type('html').send(DOCS_HTML));
  api.use('/hotels', hotelRoutes({ hotelService }));
  api.use('/restaurants', restaurantRoutes({ restaurantService }));
  api.use('/bookings', bookingRoutes({ bookingService, requireAuth }));
  api.use('/', catalogRoutes({ repos }));
  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.services = { hotelService, restaurantService, bookingService };
  return app;
}

module.exports = { createApp };
