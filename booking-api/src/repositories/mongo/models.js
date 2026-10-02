const mongoose = require('mongoose');
const {
  HOTEL_CERTIFICATIONS, HOTEL_FEATURES, RESTAURANT_CERTIFICATIONS, RESTAURANT_FEATURES,
  DIETARY_OPTIONS, BOOKING_TYPES, BOOKING_STATUSES,
} = require('../../domain/catalog');

const { Schema } = mongoose;

// Documents use string ids (slugs for the catalogue, UUIDs for bookings) so
// that the in-memory and Mongo implementations expose identical identifiers.
const stringId = { _id: { type: String, required: true } };

const toJSON = {
  transform(_, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const GeoSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const RoomTypeSchema = new Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  totalRooms: { type: Number, required: true, min: 0 },
  pricePerNight: { type: Number, required: true, min: 0 },
}, { _id: false });

const HotelSchema = new Schema({
  ...stringId,
  name: { type: String, required: true },
  city: { type: String, required: true, index: true },
  country: { type: String, required: true },
  address: String,
  coordinates: GeoSchema,
  description: String,
  highlights: [String],
  currency: { type: String, default: 'EUR' },
  lowestPricePerNight: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
  certifications: [{ type: String, enum: HOTEL_CERTIFICATIONS }],
  sustainabilityFeatures: [{ type: String, enum: HOTEL_FEATURES }],
  roomTypes: [RoomTypeSchema],
  carbonKgPerGuestNight: { type: Number, min: 0, required: true },
  ecoScore: { type: Number, min: 0, max: 100, index: true },
  checkInTime: String,
  checkOutTime: String,
  imageTheme: String,
}, { timestamps: true, toJSON });

const OpeningHoursSchema = new Schema({
  days: [{ type: Number, min: 0, max: 6 }],
  open: { type: String, required: true },
  close: { type: String, required: true },
}, { _id: false });

const RestaurantSchema = new Schema({
  ...stringId,
  name: { type: String, required: true },
  city: { type: String, required: true, index: true },
  country: { type: String, required: true },
  address: String,
  coordinates: GeoSchema,
  description: String,
  highlights: [String],
  cuisine: [String],
  dietaryOptions: [{ type: String, enum: DIETARY_OPTIONS }],
  priceLevel: { type: Number, min: 1, max: 4 },
  currency: { type: String, default: 'EUR' },
  averagePricePerCover: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
  certifications: [{ type: String, enum: RESTAURANT_CERTIFICATIONS }],
  sustainabilityFeatures: [{ type: String, enum: RESTAURANT_FEATURES }],
  seatingCapacity: { type: Number, min: 1, required: true },
  openingHours: [OpeningHoursSchema],
  carbonKgPerCover: { type: Number, min: 0, required: true },
  ecoScore: { type: Number, min: 0, max: 100, index: true },
  imageTheme: String,
}, { timestamps: true, toJSON });

const BookingSchema = new Schema({
  ...stringId,
  reference: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userEmail: String,
  tripId: { type: String, index: true, default: null },
  type: { type: String, enum: BOOKING_TYPES, required: true },
  status: { type: String, enum: BOOKING_STATUSES, required: true },
  venue: {
    id: String, name: String, city: String, country: String,
  },
  hotel: {
    hotelId: String,
    roomTypeCode: String,
    roomTypeName: String,
    checkIn: Date,
    checkOut: Date,
    nights: Number,
    guests: Number,
    rooms: Number,
  },
  restaurant: {
    restaurantId: String,
    date: String,
    time: String,
    partySize: Number,
    startsAt: Date,
    endsAt: Date,
  },
  pricing: {
    currency: String, unitAmount: Number, units: Number, total: Number,
  },
  ecoImpact: {
    carbonKgCO2e: Number, baselineKgCO2e: Number, carbonSavedKgCO2e: Number, savingsPercent: Number,
  },
  notes: String,
  cancelledAt: Date,
}, { timestamps: true, toJSON, minimize: false });

BookingSchema.index({ type: 1, status: 1, 'hotel.hotelId': 1, 'hotel.checkIn': 1, 'hotel.checkOut': 1 });
BookingSchema.index({ type: 1, status: 1, 'restaurant.restaurantId': 1, 'restaurant.startsAt': 1 });

module.exports = {
  Hotel: mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema),
  Restaurant: mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema),
  Booking: mongoose.models.Booking || mongoose.model('Booking', BookingSchema),
};
