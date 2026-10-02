const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

function bookingRoutes({ bookingService, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', asyncHandler(async (req, res) => {
    const items = await bookingService.listBookings(req.user, req.query);
    res.json({ items, total: items.length });
  }));

  // Declared before /:id so "summary" is never treated as an id.
  router.get('/summary', asyncHandler(async (req, res) => {
    res.json(await bookingService.summarize(req.user, req.query));
  }));

  router.post('/hotels', asyncHandler(async (req, res) => {
    res.status(201).json(await bookingService.createHotelBooking(req.user, req.body));
  }));

  router.post('/restaurants', asyncHandler(async (req, res) => {
    res.status(201).json(await bookingService.createRestaurantBooking(req.user, req.body));
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    res.json(await bookingService.getBooking(req.user, req.params.id));
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    res.json(await bookingService.cancelBooking(req.user, req.params.id));
  }));

  return router;
}

module.exports = { bookingRoutes };
