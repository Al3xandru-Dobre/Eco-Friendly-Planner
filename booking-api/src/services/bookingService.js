const { randomBytes } = require('crypto');
const { hotelStayImpact, restaurantMealImpact } = require('../domain/ecoImpact');
const { RESTAURANT_SEATING_MINUTES, BOOKING_TYPES, BOOKING_STATUSES } = require('../domain/catalog');
const { badRequest, conflict, notFound, forbidden } = require('../utils/httpError');
const {
  requireString, optionalString, requireInt, optionalInt, requireDateOnly, requireTime, toDateOnly, oneOf,
} = require('../utils/validate');

/** Human-friendly reference such as ECO-7K3Q9D (no ambiguous 0/O or 1/I). */
function makeReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return `ECO-${[...bytes].map((b) => alphabet[b % alphabet.length]).join('')}`;
}

/** Output shape: dates as ISO strings, date-only fields as YYYY-MM-DD. */
function serializeBooking(b) {
  const out = {
    id: b.id,
    reference: b.reference,
    type: b.type,
    status: b.status,
    tripId: b.tripId ?? null,
    userId: b.userId,
    venue: b.venue,
    pricing: b.pricing,
    ecoImpact: b.ecoImpact,
    notes: b.notes ?? null,
    createdAt: toIso(b.createdAt),
    updatedAt: toIso(b.updatedAt),
    cancelledAt: toIso(b.cancelledAt),
  };
  if (b.type === 'HOTEL') {
    out.hotel = {
      ...b.hotel,
      checkIn: toDateOnly(b.hotel.checkIn),
      checkOut: toDateOnly(b.hotel.checkOut),
    };
  } else {
    const { startsAt, endsAt, ...rest } = b.restaurant;
    out.restaurant = { ...rest, startsAt: toIso(startsAt), endsAt: toIso(endsAt) };
  }
  return out;
}

const toIso = (d) => (d ? new Date(d).toISOString() : null);

function createBookingService({ repos, hotelService, restaurantService }) {
  async function createHotelBooking(user, body = {}) {
    const hotelId = requireString(body.hotelId, 'hotelId');
    const roomTypeCode = requireString(body.roomTypeCode, 'roomTypeCode');
    const tripId = optionalString(body.tripId, 'tripId');
    const notes = optionalString(body.notes, 'notes', { maxLength: 1000 });

    const hotel = await hotelService.getHotel(hotelId);
    const room = hotel.roomTypes.find((r) => r.code === roomTypeCode);
    if (!room) throw badRequest(`Room type "${roomTypeCode}" does not exist at ${hotel.name}`, { field: 'roomTypeCode' });

    const stay = hotelService.parseStayWindow(body, { required: true });
    if (room.capacity * stay.rooms < stay.guests) {
      throw badRequest(`${room.name} sleeps ${room.capacity} per room; ${stay.guests} guests need more rooms`, { field: 'guests' });
    }

    const availability = await hotelService.roomAvailability(hotel, stay);
    const slot = availability.find((r) => r.code === room.code);
    if (slot.availableRooms < stay.rooms) {
      throw conflict(`Only ${slot.availableRooms} ${room.name} room(s) left for those dates`, { availableRooms: slot.availableRooms });
    }

    const booking = await repos.bookings.create({
      reference: makeReference(),
      userId: user.id,
      userEmail: user.email,
      tripId: tripId ?? null,
      type: 'HOTEL',
      status: 'CONFIRMED',
      venue: { id: hotel.id, name: hotel.name, city: hotel.city, country: hotel.country },
      hotel: {
        hotelId: hotel.id,
        roomTypeCode: room.code,
        roomTypeName: room.name,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        nights: stay.nights,
        guests: stay.guests,
        rooms: stay.rooms,
      },
      pricing: {
        currency: hotel.currency,
        unitAmount: room.pricePerNight,
        units: stay.nights * stay.rooms,
        total: room.pricePerNight * stay.nights * stay.rooms,
      },
      ecoImpact: hotelStayImpact({ carbonKgPerGuestNight: hotel.carbonKgPerGuestNight, guests: stay.guests, nights: stay.nights }),
      notes,
    });
    return serializeBooking(booking);
  }

  async function createRestaurantBooking(user, body = {}) {
    const restaurantId = requireString(body.restaurantId, 'restaurantId');
    const tripId = optionalString(body.tripId, 'tripId');
    const notes = optionalString(body.notes, 'notes', { maxLength: 1000 });
    const date = requireDateOnly(body.date, 'date');
    const time = requireTime(body.time, 'time');
    const partySize = requireInt(body.partySize, 'partySize', { min: 1, max: 30 });

    const restaurant = await restaurantService.getRestaurant(restaurantId);
    const slots = await restaurantService.slotAvailability(restaurant, { date, partySize });
    const slot = slots.find((s) => s.time === time);
    if (!slot) {
      throw badRequest(`${restaurant.name} does not take bookings at ${time} on ${toDateOnly(date)}`, { field: 'time', slots: slots.map((s) => s.time) });
    }
    if (!slot.available) {
      throw conflict(`Only ${slot.availableSeats} seat(s) left at ${time}`, { availableSeats: slot.availableSeats });
    }

    const startsAt = restaurantService.slotInstant(date, time);
    const endsAt = new Date(startsAt.getTime() + RESTAURANT_SEATING_MINUTES * 60 * 1000);
    const booking = await repos.bookings.create({
      reference: makeReference(),
      userId: user.id,
      userEmail: user.email,
      tripId: tripId ?? null,
      type: 'RESTAURANT',
      status: 'CONFIRMED',
      venue: { id: restaurant.id, name: restaurant.name, city: restaurant.city, country: restaurant.country },
      restaurant: { restaurantId: restaurant.id, date: toDateOnly(date), time, partySize, startsAt, endsAt },
      pricing: {
        currency: restaurant.currency,
        unitAmount: restaurant.averagePricePerCover,
        units: partySize,
        total: restaurant.averagePricePerCover * partySize,
      },
      ecoImpact: restaurantMealImpact({ carbonKgPerCover: restaurant.carbonKgPerCover, partySize }),
      notes,
    });
    return serializeBooking(booking);
  }

  async function listBookings(user, rawQuery = {}) {
    const filter = {
      userId: user.id,
      tripId: optionalString(rawQuery.tripId, 'tripId'),
      status: oneOf(rawQuery.status, 'status', BOOKING_STATUSES, undefined),
      type: oneOf(rawQuery.type, 'type', BOOKING_TYPES, undefined),
    };
    const bookings = await repos.bookings.find(filter);
    return bookings.map(serializeBooking);
  }

  async function getOwnedBooking(user, id) {
    const booking = await repos.bookings.findById(id);
    if (!booking) throw notFound(`Booking "${id}" not found`);
    if (booking.userId !== user.id) throw forbidden('This booking belongs to another traveller');
    return booking;
  }

  async function getBooking(user, id) {
    return serializeBooking(await getOwnedBooking(user, id));
  }

  async function cancelBooking(user, id) {
    const booking = await getOwnedBooking(user, id);
    if (booking.status === 'CANCELLED') return serializeBooking(booking);
    const updated = await repos.bookings.update(id, { status: 'CANCELLED', cancelledAt: new Date() });
    return serializeBooking(updated);
  }

  /** Aggregates used by the planner to show a trip's stay/dining footprint. */
  async function summarize(user, rawQuery = {}) {
    const tripId = optionalString(rawQuery.tripId, 'tripId');
    const bookings = await repos.bookings.find({ userId: user.id, tripId });
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
    const totals = {};
    for (const b of confirmed) {
      totals[b.pricing.currency] = Math.round(((totals[b.pricing.currency] || 0) + b.pricing.total) * 100) / 100;
    }
    const sum = (key) => Math.round(confirmed.reduce((acc, b) => acc + (b.ecoImpact[key] || 0), 0) * 10) / 10;
    return {
      tripId: tripId ?? null,
      count: bookings.length,
      confirmedCount: confirmed.length,
      cancelledCount: bookings.length - confirmed.length,
      hotelNights: confirmed.filter((b) => b.type === 'HOTEL').reduce((acc, b) => acc + b.hotel.nights * b.hotel.rooms, 0),
      restaurantCovers: confirmed.filter((b) => b.type === 'RESTAURANT').reduce((acc, b) => acc + b.restaurant.partySize, 0),
      totalsByCurrency: totals,
      carbonKgCO2e: sum('carbonKgCO2e'),
      baselineKgCO2e: sum('baselineKgCO2e'),
      carbonSavedKgCO2e: sum('carbonSavedKgCO2e'),
    };
  }

  return { createHotelBooking, createRestaurantBooking, listBookings, getBooking, cancelBooking, summarize };
}

module.exports = { createBookingService, serializeBooking, makeReference };
