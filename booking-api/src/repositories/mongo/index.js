const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const { Hotel, Restaurant, Booking } = require('./models');
const { MATCH_ALL } = require('../../domain/filters/FilterBuilder');

/** Converts a lean Mongo document into the plain shape the services expect. */
function normalize(doc) {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
}

class MongoCatalogRepository {
  constructor(Model) {
    this.Model = Model;
  }

  async insertMany(items) {
    const docs = items.map(({ id, ...rest }) => ({ _id: id, ...rest }));
    await this.Model.bulkWrite(docs.map((doc) => ({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
    })));
    return docs.length;
  }

  async clear() {
    await this.Model.deleteMany({});
  }

  async count() {
    return this.Model.countDocuments();
  }

  /** @param {{ toMongo(): object }} filter Specification from FilterBuilder */
  async findAll(filter = MATCH_ALL) {
    const docs = await this.Model.find(filter.toMongo()).lean();
    return docs.map(normalize);
  }

  async findById(id) {
    return normalize(await this.Model.findById(id).lean());
  }
}

class MongoBookingRepository {
  async create(doc) {
    const created = await Booking.create({ _id: randomUUID(), ...doc });
    return normalize(created.toObject());
  }

  async findById(id) {
    return normalize(await Booking.findById(id).lean());
  }

  async find({ userId, tripId, status, type } = {}) {
    const query = {};
    if (userId !== undefined) query.userId = userId;
    if (tripId !== undefined) query.tripId = tripId;
    if (status !== undefined) query.status = status;
    if (type !== undefined) query.type = type;
    const docs = await Booking.find(query).sort({ createdAt: -1 }).lean();
    return docs.map(normalize);
  }

  async findHotelOverlaps({ hotelId, roomTypeCode, checkIn, checkOut }) {
    const query = {
      type: 'HOTEL',
      status: 'CONFIRMED',
      'hotel.hotelId': hotelId,
      'hotel.checkIn': { $lt: checkOut },
      'hotel.checkOut': { $gt: checkIn },
    };
    if (roomTypeCode !== undefined) query['hotel.roomTypeCode'] = roomTypeCode;
    return (await Booking.find(query).lean()).map(normalize);
  }

  async findRestaurantOverlaps({ restaurantId, start, end }) {
    const docs = await Booking.find({
      type: 'RESTAURANT',
      status: 'CONFIRMED',
      'restaurant.restaurantId': restaurantId,
      'restaurant.startsAt': { $lt: end },
      'restaurant.endsAt': { $gt: start },
    }).lean();
    return docs.map(normalize);
  }

  async update(id, patch) {
    const doc = await Booking.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return normalize(doc);
  }
}

async function createMongoRepositories({ mongoUri }) {
  await mongoose.connect(mongoUri);
  return {
    driver: 'mongo',
    hotels: new MongoCatalogRepository(Hotel),
    restaurants: new MongoCatalogRepository(Restaurant),
    bookings: new MongoBookingRepository(),
    async close() {
      await mongoose.disconnect();
    },
  };
}

module.exports = { createMongoRepositories, normalize };
