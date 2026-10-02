const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

function hotelRoutes({ hotelService }) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await hotelService.listHotels(req.query));
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    res.json(await hotelService.getHotel(req.params.id));
  }));

  router.get('/:id/availability', asyncHandler(async (req, res) => {
    res.json(await hotelService.getAvailability(req.params.id, req.query));
  }));

  return router;
}

module.exports = { hotelRoutes };
