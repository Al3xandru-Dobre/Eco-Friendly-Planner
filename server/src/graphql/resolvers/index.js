// server/src/graphql/resolvers/index.js

// Importă resolver-ele specifice din fișierele corespunzătoare
const userResolvers = require('./userResolvers');
const tripResolvers = require('./tripResolvers');
// const suggestionResolvers = require('./suggestionResolvers'); // Dacă există

const resolvers = {
  // Date: new GraphQLScalarType({ ... }), // Dacă ai scalari custom

  Query: {
    ...userResolvers.Query,
    ...tripResolvers.Query,
    // ...suggestionResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...tripResolvers.Mutation,
    // ...suggestionResolvers.Mutation,
  },

  // Resolveri de câmp specifici pentru tipuri (dacă e cazul)
  ...(tripResolvers.Trip && { Trip: tripResolvers.Trip }),
  ...(userResolvers.User && { User: userResolvers.User }),
  // ...(suggestionResolvers.Suggestion && { Suggestion: suggestionResolvers.Suggestion }),
};

module.exports = resolvers;