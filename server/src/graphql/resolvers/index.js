// server/src/graphql/resolvers/index.js
const userResolvers = require('./userResolvers');
const tripResolvers = require('./tripResolvers');
const bookingResolvers = require('./bookingResolvers');

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...tripResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...tripResolvers.Mutation,
  },

  // Field resolvers: Trip gets its booking fields from the booking API client.
  Trip: {
    ...(tripResolvers.Trip || {}),
    ...bookingResolvers.Trip,
  },
  ...(userResolvers.User && { User: userResolvers.User }),
};

module.exports = resolvers;
