const { AuthenticationError, UserInputError } = require('apollo-server-express');
const Trip = require('../../models/Trip');
const User = require('../../models/User'); // Probabil nu e necesar aici dacă folosim populate bine
const { calculateEcoScore, calculateTransportCarbonFootprint } = require('../../services/carbonCalculator');

// Helper pentru a verifica dacă user-ul este proprietarul (opțional, pentru a nu repeta cod)
const checkOwnership = (trip, context) => {
  if (trip.createdBy.toString() !== context.user.id) {
    throw new AuthenticationError('Action not allowed. You are not the owner of this trip.');
    // Sau: throw new ForbiddenError('Action not allowed. You are not the owner of this trip.');
  }
};



module.exports = {
  Query: {
    getTrips: async () => {
      try {
        // Populează și travelers dacă este necesar la afișarea generală
        const trips = await Trip.find().sort({ createdAt: -1 }).populate('createdBy').populate('travelers');
        return trips;
      } catch (err) {
        console.error("Error fetching trips:", err);
        throw new Error("Failed to fetch trips.");
      }
    },
    getTrip: async (_, { tripId }) => {
      try {
        const trip = await Trip.findById(tripId).populate('createdBy').populate('travelers');
        if (!trip) {
          throw new UserInputError('Trip not found');
        }
        return trip;
      } catch (err) {
        if (err.kind === 'ObjectId') {
          throw new UserInputError('Invalid Trip ID format');
        }
        console.error(`Error fetching trip ${tripId}:`, err);
        throw new Error(`Failed to fetch trip.`);
      }
    },
    getUserTrips: async (_, __, context) => { // Am scos userId, luăm din context
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to view your trips.');
      }
      try {
        // Găsește călătoriile create de user-ul autentificat
        const trips = await Trip.find({ createdBy: context.user.id })
          .sort({ startDate: -1 }) // Sortează după data de început, cele mai recente primele
          .populate('createdBy')
          .populate('travelers');
        return trips;
      } catch (err) {
        console.error(`Error fetching trips for user ${context.user.id}:`, err);
        throw new Error('Failed to fetch user trips.');
      }
    },
  },


  Mutation: {
    createTrip: async (_, { createTripInput }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to create a trip.');
      }

      const { destination, startDate, endDate, travelers, transportationType, distanceKm, numberOfTravelers, ...otherFields } = createTripInput;

      if (destination.trim() === '') {
        throw new UserInputError('Destination must not be empty');
      }
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (parsedStartDate >= parsedEndDate) {
        throw new UserInputError('Start date must be before end date.');
      }

      
      // Verifică dacă ID-urile traveler-ilor sunt valide (dacă sunt furnizate)
      let validTravelerIds = [context.user.id];

      if (travelers && travelers.length > 0) {
        const users = await User.find({ '_id': { $in: travelers.filter(id => id !== context.user.id) } });
       
        //extrage ID-urile din input care nu dau match cu id-ul creatorului
        const inputTravalerIDsWithoutCreator = travelers.filter(id => id !== context.user.id);

       
        if (users.length !== inputTravalerIDsWithoutCreator.length) {
            throw new UserInputError('One or more traveler IDs are invalid.');
        }

        validTravelerIds = [context.user.id];
        validTravelerIds.push(...users.map(u => u.id))
           validTravelerIds = [...new Set(validTravelerIds)]; //asigura unicitatea 
      }

      const actualNumberOfTravelers = numberOfTravelers !== undefined ? Math.max(1,numberOfTravelers) : validTravelerIds.length

      // Adaugă creatorul ca traveler dacă nu e deja în listă (opțional)
      if (!validTravelerIds.includes(context.user.id)) {
          validTravelerIds.push(context.user.id);
      }

      const carbonFootprintKgCO2e = calculateTransportCarbonFootprint({
        transportationType,
        distanceKm,
        numberOfTravelers: actualNumberOfTravelers
      });

      const ecoScore = calculateEcoScore({
        carbonFootprintKgCO2e,
        transportationType
      });

      const newTrip = new Trip({
        ...otherFields,
        destination,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        createdBy: context.user.id,
        travelers: validTravelerIds, 
        transportationType,
        distanceKm,
        numberOfTravelers: actualNumberOfTravelers,
        carbonFootprintKgCO2e,
        ecoScore,
      });

      try {
        const trip = await newTrip.save();
        await trip.populate('createdBy');
        await trip.populate('travelers');
        return trip;
      } catch (err) {
          console.error("Error creating trip:", err);
          if (err.name === 'ValidationError') {
              throw new UserInputError(err.message, { validationErrors: err.errors });
          }
          throw new Error('Failed to create trip.');
      }

    },

    updateTrip: async (_, { tripId, updateTripInput }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to update a trip.');
      }

      try {
        const trip = await Trip.findById(tripId);

        if (!trip) {
          throw new UserInputError('Trip not found');
        }

        checkOwnership(trip, context); // Verifică dacă user-ul este proprietarul

        const currentTransportationType = updateTripInput.transportationType || trip.transportationType
        const currentDistanceKm = updateTripInput.distanceKm || trip.distanceKm;

        let currentNumberOfTravelers = trip.numberOfTravelers;


        // Procesează actualizările, inclusiv datele și călătorii
        if (updateTripInput.numberOfTravelers !== undefined) {

          currentNumberOfTravelers = updateTripInput.numberOfTravelers
        
        } else if (updateTripInput.travelers && Array.isArray(updateTripInput.travelers)) {

          currentNumberOfTravelers = updateTripInput.travelers.length;
        } else {

          currentNumberOfTravelers = trip.numberOfTravelers;
        }

        currentNumberOfTravelers = Math.max(1, currentNumberOfTravelers);

        if(updateTripInput.transportationType || updateTripInput.distanceKm || updateTripInput.numberOfTravelers) {
          
          updateTripInput.carbonFootprintKgCO2e = calculateTransportCarbonFootprint({
          
            transportationType: currentTransportationType,
            distanceKm: currentDistanceKm,
            numberOfTravelers: currentNumberOfTravelers
          
          });

          updateTripInput.ecoScore = calculateEcoScore ({
            
            carbonFootprintKgCO2e: updateTripInput.carbonFootprintKgCO2e,
            transportationType: currentTransportationType
          
          })

        }

        if (updateTripInput.startDate) {
            updateTripInput.startDate = new Date(updateTripInput.startDate);
        }
        if (updateTripInput.endDate) {
            updateTripInput.endDate = new Date(updateTripInput.endDate);
        }
        if (updateTripInput.startDate && updateTripInput.endDate && updateTripInput.startDate >= updateTripInput.endDate) {
            throw new UserInputError('Start date must be before end date.');
        }
        if (updateTripInput.startDate && !updateTripInput.endDate && trip.endDate && updateTripInput.startDate >= trip.endDate) {
            throw new UserInputError('Start date must be before existing end date.');
        }
        if (updateTripInput.endDate && !updateTripInput.startDate && trip.startDate && trip.startDate >= updateTripInput.endDate) {
            throw new UserInputError('Existing start date must be before new end date.');
        }


        if (updateTripInput.travelers && updateTripInput.travelers.length > 0) {
            const users = await User.find({ '_id': { $in: updateTripInput.travelers } });
            if (users.length !== updateTripInput.travelers.length) {
                throw new UserInputError('One or more traveler IDs are invalid for update.');
            }
            updateTripInput.travelers = users.map(u => u.id);
          }


        const updatedTrip = await Trip.findByIdAndUpdate(
          tripId,
          { $set: updateTripInput },
          { new: true, runValidators: true } // new:true returnează documentul actualizat, runValidators:true rulează validările Mongoose
        ).populate('createdBy').populate('travelers');

        if (!updatedTrip) { // Verificare suplimentară
            throw new UserInputError('Trip not found after update attempt.');
        }

        return updatedTrip;

      } catch (err) {
        if (err.kind === 'ObjectId') {
          throw new UserInputError('Invalid Trip ID format');
        }
        // Propagă erorile specifice deja aruncate
        if (err instanceof UserInputError || err instanceof AuthenticationError /*|| err instanceof ForbiddenError*/) {
          throw err;
        }
        console.error(`Error updating trip ${tripId}:`, err);
        if (err.name === 'ValidationError') {
            throw new UserInputError(err.message, { validationErrors: err.errors });
        }
        throw new Error('Failed to update trip.');
      }
    },

    deleteTrip: async (_, { tripId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to delete a trip.');
      }

      try {
        const trip = await Trip.findById(tripId);

        if (!trip) {
          throw new UserInputError('Trip not found');
        }

        checkOwnership(trip, context); // Verifică dacă user-ul este proprietarul

        await Trip.findByIdAndDelete(tripId);

        return "Trip deleted successfully"; // Sau returnează ID-ul călătoriei șterse sau trip-ul șters

      } catch (err) {
        if (err.kind === 'ObjectId') {
          throw new UserInputError('Invalid Trip ID format');
        }
        if (err instanceof UserInputError || err instanceof AuthenticationError /*|| err instanceof ForbiddenError*/) {
          throw err;
        }
        console.error(`Error deleting trip ${tripId}:`, err);
        throw new Error('Failed to delete trip.');
      }
    }
  },

  //COD OUT OF DATE sau potential re-use
  // resolveri specifici pentru câmpurile din Trip (ex: formatare date custom)
  // Trip: {
  //   startDate: (parent) => new Date(parent.startDate).toLocaleDateString(), // Exemplu
  //   // createdBy și travelers sunt de obicei gestionate bine de .populate()
  // }
};