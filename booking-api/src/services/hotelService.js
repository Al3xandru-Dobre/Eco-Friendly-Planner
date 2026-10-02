const { hotelFilter } = require('../domain/catalogFilters');
const { hotelStayImpact } = require('../domain/ecoImpact');
const { notFound, badRequest } = require('../utils/httpError');
const {
  csvList, optionalInt, optionalNumber, optionalString, requireDateOnly, daysBetween, toDateOnly,
} = require('../utils/validate');
const { paginate } = require('./pagination');

const MAX_NIGHTS = 30;

function parseStayWindow(query, { required }) {
  const hasAny = query.checkIn || query.checkOut;
  if (!hasAny && !required) return null;
  const checkIn = requireDateOnly(query.checkIn, 'checkIn');
  const checkOut = requireDateOnly(query.checkOut, 'checkOut');
  const nights = daysBetween(checkIn, checkOut);
  if (nights < 1) throw badRequest('checkOut must be at least one day after checkIn', { field: 'checkOut' });
  if (nights > MAX_NIGHTS) throw badRequest(`Stays are limited to ${MAX_NIGHTS} nights`, { field: 'checkOut' });
  const guests = optionalInt(query.guests, 'guests', { min: 1, max: 20 }) ?? 1;
  const rooms = optionalInt(query.rooms, 'rooms', { min: 1, max: 10 }) ?? 1;
  return { checkIn, checkOut, nights, guests, rooms };
}

function createHotelService({ repos }) {
  async function listHotels(rawQuery = {}) {
    const query = {
      city: optionalString(rawQuery.city, 'city'),
      country: optionalString(rawQuery.country, 'country'),
      certifications: csvList(rawQuery.certification ?? rawQuery.certifications),
      features: csvList(rawQuery.feature ?? rawQuery.features),
      minEcoScore: optionalNumber(rawQuery.minEcoScore, 'minEcoScore', { min: 0, max: 100 }),
      minRating: optionalNumber(rawQuery.minRating, 'minRating', { min: 0, max: 5 }),
      maxPrice: optionalNumber(rawQuery.maxPrice, 'maxPrice', { min: 0 }),
      q: optionalString(rawQuery.q, 'q', { maxLength: 100 }),
    };
    const stay = parseStayWindow(rawQuery, { required: false });

    let hotels = await repos.hotels.findAll(hotelFilter(query));

    if (stay) {
      // Keep only hotels with at least one room type that can host the party.
      const withAvailability = await Promise.all(hotels.map(async (hotel) => {
        const availability = await roomAvailability(hotel, stay);
        const bookable = availability.filter((r) => r.available);
        return bookable.length ? { ...hotel, availability: bookable } : null;
      }));
      hotels = withAvailability.filter(Boolean);
    }

    return { ...paginate(hotels, rawQuery), stay: stay && { ...stay, checkIn: toDateOnly(stay.checkIn), checkOut: toDateOnly(stay.checkOut) } };
  }

  async function getHotel(id) {
    const hotel = await repos.hotels.findById(id);
    if (!hotel) throw notFound(`Hotel "${id}" not found`);
    return hotel;
  }

  /** Availability per room type for a stay window, including price and eco impact. */
  async function roomAvailability(hotel, stay) {
    const overlaps = await repos.bookings.findHotelOverlaps({
      hotelId: hotel.id, checkIn: stay.checkIn, checkOut: stay.checkOut,
    });
    return hotel.roomTypes.map((room) => {
      const booked = overlaps
        .filter((b) => b.hotel.roomTypeCode === room.code)
        .reduce((sum, b) => sum + (b.hotel.rooms || 1), 0);
      const availableRooms = Math.max(0, room.totalRooms - booked);
      const fitsParty = room.capacity * stay.rooms >= stay.guests;
      const total = room.pricePerNight * stay.nights * stay.rooms;
      return {
        code: room.code,
        name: room.name,
        capacity: room.capacity,
        pricePerNight: room.pricePerNight,
        currency: hotel.currency,
        totalRooms: room.totalRooms,
        availableRooms,
        fitsParty,
        available: availableRooms >= stay.rooms && fitsParty,
        total,
        ecoImpact: hotelStayImpact({ carbonKgPerGuestNight: hotel.carbonKgPerGuestNight, guests: stay.guests, nights: stay.nights }),
      };
    });
  }

  async function getAvailability(id, rawQuery) {
    const hotel = await getHotel(id);
    const stay = parseStayWindow(rawQuery, { required: true });
    const roomTypes = await roomAvailability(hotel, stay);
    return {
      hotel: { id: hotel.id, name: hotel.name, city: hotel.city, currency: hotel.currency },
      checkIn: toDateOnly(stay.checkIn),
      checkOut: toDateOnly(stay.checkOut),
      nights: stay.nights,
      guests: stay.guests,
      rooms: stay.rooms,
      roomTypes,
    };
  }

  return { listHotels, getHotel, getAvailability, roomAvailability, parseStayWindow };
}

module.exports = { createHotelService, MAX_NIGHTS };
