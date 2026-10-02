const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

function restaurantRoutes({ restaurantService }) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await restaurantService.listRestaurants(req.query));
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    res.json(await restaurantService.getRestaurant(req.params.id));
  }));

  router.get('/:id/availability', asyncHandler(async (req, res) => {
    res.json(await restaurantService.getAvailability(req.params.id, req.query));
  }));

  return router;
}

module.exports = { restaurantRoutes };
