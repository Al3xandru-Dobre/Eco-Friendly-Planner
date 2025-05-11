const { AuthenticationError, UserInputError } = require('apollo-server-express');
const Trip = require('../../models/Trip');
const User = require('../../models/User'); 
// const checkAuth = require('../../utils/checkAuth'); // Vom crea acest helper

module.exports = {
  Query: {
    getTrips: async () => {
      try {
        const trips = await Trip.find().sort({ createdAt: -1 }).populate('createdBy').populate('travelers');
        return trips;
      } catch (err) {
        throw new Error(err);
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
        // Gestionează eroarea dacă ID-ul nu e valid pentru MongoDB
        if (err.kind === 'ObjectId') {
          throw new UserInputError('Invalid Trip ID format');
        }
        throw new Error(err);
      }
    },
    // getUserTrips: async (_, { userId }) => { ... }
  },
  Mutation: {

    //functionalitate pentru creearea unei noi calatorii
    createTrip: async (_, { createTripInput }, context) => {
      // const user = checkAuth(context); // Verificăm autentificarea
      if (!context.user) { // Verificare simplă de autentificare pentru început
          throw new AuthenticationError('You must be logged in to create a trip.');
      }

      const { destination, startDate, endDate, ...otherFields } = createTripInput;

      if (destination.trim() === '') {
        throw new UserInputError('Destination must not be empty');
      }
      // TODO: De adaugat mai multe validări (ex: startDate < endDate)

      const newTrip = new Trip({
        ...otherFields,
        destination,
        startDate: new Date(startDate), 
        endDate: new Date(endDate),     
        createdBy: context.user.id,     // ID-ul user-ului autentificat
        // travelers: [context.user.id] // Opțional, adaugă creatorul ca prim călător
      });

      const trip = await newTrip.save();
      // Pentru a returna obiectul Trip populat cum e definit în schema GraphQL
      await trip.populate('createdBy'); // .populate('travelers') dacă e cazul

      return trip;
    },
    // updateTrip: async (_, { tripId, updateTripInput }, context) => { ... }
    // deleteTrip: async (_, { tripId }, context) => { ... }
    

    //functionalitatea de modificare si actualizare a informatiilor unei calatorii deha create
    updateTrip: async(_,{tripID, updateTripInput}, context) => {
      if(!context.user){
        throw new AuthenticationError('You must be logged in to update a trip.');
      }

      try{
        const trip = await Trip.findById(tripID);

        if(!trip){
          throw new UserInputError('Trip not found');
        }

        if(trip.createdBy.toString() !== context.user.id) {
          throw new ForbiddenError('Action not allowed. You are not the owner of this trip.');
        }

        
        if (updateTripInput.startDate) updateTripInput.startDate = new Date(updateTripInput.startDate);
        if (updateTripInput.endDate) updateTripInput.endDate = new Date(updateTripInput.endDate);
        //Object.assign(trip,updateTripInput)

        const updatedTrip = await Trip.findByIdAnUpdate(tripID,
          {$set: updateTripInput },
          {new: true, runValidators:true }
        ).populate('created by').populate('travelers');

        return updatedTrip;

      } catch(err) {

        if(err.kind === 'ObjectId') {
          throw new UserInputError('Invalid Trip ID format');
        }

        if (err instanceof UserInputError || err instanceof AuthenticationError || err instanceof ForbiddenError) {
          throw err;
      }
      throw new Error('Failed to update trip: ' + err.message);
      }
    }
  

    //deleteTrip TO DO

    // deleteTrip: asyinc(_,{tripID},context) => {
    //   if(!context.user){
        
    //   }
    // }
  }
  // Dacă sunt câmpuri în Trip care necesită resolver custom (ex: popularea `travelers` sau `createdBy` altfel folosesc populate direct)
  
  // Trip: {
  //   createdBy: async (parent) => {
  //     // parent este obiectul Trip
  //     return await User.findById(parent.createdBy);
  //   },
  //   travelers: async (parent) => {
  //     return await User.find({ _id: { $in: parent.travelers }});
  //   }
  // }
};