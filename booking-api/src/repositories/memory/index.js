const { randomUUID } = require('crypto');

/**
 * In-memory repositories. They implement exactly the same interface as the
 * Mongo repositories (see ../mongo/index.js), which lets the service layer and
 * the test-suite run without a database. The data lives for the lifetime of
 * the process only.
 */
class MemoryCatalogRepository {
  constructor() {
    this.items = new Map();
  }

  async insertMany(items) {
    items.forEach((item) => this.items.set(item.id, structuredClone(item)));
    return items.length;
  }

  async clear() {
    this.items.clear();
  }

  async count() {
    return this.items.size;
  }

  async findAll(predicate = () => true) {
    return [...this.items.values()].filter(predicate).map((v) => structuredClone(v));
  }

  async findById(id) {
    const item = this.items.get(id);
    return item ? structuredClone(item) : null;
  }
}

class MemoryBookingRepository {
  constructor() {
    this.items = new Map();
  }

  async create(doc) {
    const now = new Date();
    const booking = { id: randomUUID(), createdAt: now, updatedAt: now, ...doc };
    this.items.set(booking.id, structuredClone(booking));
    return structuredClone(booking);
  }

  async findById(id) {
    const item = this.items.get(id);
    return item ? structuredClone(item) : null;
  }

  async find({ userId, tripId, status, type } = {}) {
    return [...this.items.values()]
      .filter((b) => (userId === undefined || b.userId === userId)
        && (tripId === undefined || b.tripId === tripId)
        && (status === undefined || b.status === status)
        && (type === undefined || b.type === type))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((b) => structuredClone(b));
  }

  /** Confirmed hotel bookings whose stay overlaps [checkIn, checkOut). */
  async findHotelOverlaps({ hotelId, roomTypeCode, checkIn, checkOut }) {
    return [...this.items.values()].filter((b) => b.type === 'HOTEL'
      && b.status === 'CONFIRMED'
      && b.hotel.hotelId === hotelId
      && (roomTypeCode === undefined || b.hotel.roomTypeCode === roomTypeCode)
      && b.hotel.checkIn < checkOut
      && b.hotel.checkOut > checkIn).map((b) => structuredClone(b));
  }

  /** Confirmed restaurant bookings whose seating window overlaps [start, end). */
  async findRestaurantOverlaps({ restaurantId, start, end }) {
    return [...this.items.values()].filter((b) => b.type === 'RESTAURANT'
      && b.status === 'CONFIRMED'
      && b.restaurant.restaurantId === restaurantId
      && b.restaurant.startsAt < end
      && b.restaurant.endsAt > start).map((b) => structuredClone(b));
  }

  async update(id, patch) {
    const current = this.items.get(id);
    if (!current) return null;
    const updated = { ...current, ...patch, updatedAt: new Date() };
    this.items.set(id, updated);
    return structuredClone(updated);
  }
}

function createMemoryRepositories() {
  return {
    driver: 'memory',
    hotels: new MemoryCatalogRepository(),
    restaurants: new MemoryCatalogRepository(),
    bookings: new MemoryBookingRepository(),
    async close() {},
  };
}

module.exports = { createMemoryRepositories, MemoryCatalogRepository, MemoryBookingRepository };
