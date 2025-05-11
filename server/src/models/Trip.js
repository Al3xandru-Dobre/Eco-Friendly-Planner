const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TripSchema = new Schema(
  {
    destination: {
      type: String,
      required: [true, 'Destination is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    description: {
      type: String,
    },
    transportationType: {
      type: String,
      enum: [
        'TRAIN', 'BUS', 'CAR_ELECTRIC', 'CAR_HYBRID',
        'CAR_GASOLINE', 'BICYCLE', 'WALK', 'PLANE', 'BOAT',
      ],
    },

    distanceKm: { // Distanța totală a călătoriei (dus-întors dacă e cazul)
      type: Number,
      min: 0
    },

    numberOfTravelers: { // Numărul efectiv de persoane pentru împărțirea amprentei
      type: Number,
      min: 1,
      default: 1
    },

    carbonFootprintKgCO2e: { // Amprenta de carbon în kg CO2 echivalent
      type: Number,
      min: 0,
      default: 0
    },

    ecoScore: { // Un scor de la 0 la 100 (sau altă scală)
      type: Number,
      min: 0,
      max: 100, // Sau 5 stele, etc.
      default: 0
    },

    accommodationType: {
      type: String,
    },
    ecoRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    notes: {
      type: String,
    },
    travelers: [{ // Deși schema GraphQL spune [User!], aici stocăm ID-uri
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true } // Adaugă automat createdAt și updatedAt
);

// Index pentru a căuta rapid călătoriile unui user
TripSchema.index({ createdBy: 1 });
TripSchema.index({ startDate: 1 });

module.exports = mongoose.model('Trip', TripSchema);