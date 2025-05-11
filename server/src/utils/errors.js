const { ApolloError } = require('apollo-server-express');

class ForbiddenError extends ApolloError {
  constructor(message) {
    super(message, 'FORBIDDEN'); // Codul 'FORBIDDEN' e important
    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}

module.exports = { ForbiddenError };