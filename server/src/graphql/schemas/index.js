// server/src/graphql/schemas/index.js
const { gql } = require('apollo-server-express');
const fs = require('fs');
const path = require('path');

const baseTypeDefs = gql`
  type Query {
    _emptyQuery: String
  }
  type Mutation {
    _emptyMutation: String
  }
`;

const load = (file) => gql(fs.readFileSync(path.join(__dirname, file), 'utf-8'));

const typeDefsArray = [
  baseTypeDefs,
  load('user.graphql'),
  load('trip.graphql'),
  load('booking.graphql'),
];

module.exports = typeDefsArray;
