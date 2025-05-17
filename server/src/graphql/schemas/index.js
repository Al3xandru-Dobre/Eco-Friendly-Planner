// server/src/graphql/schemas/index.js
const { gql } = require('apollo-server-express');
const fs = require('fs'); // Comentat dacă nu e folosit
 const path = require('path'); // Comentat dacă nu e folosit

const baseTypeDefs = gql`
  type Query {
    _emptyQuery: String
  }
  type Mutation {
    _emptyMutation: String
  }
`;




const userTypeDefs = gql(fs.readFileSync(path.join(__dirname, 'user.graphql'), 'utf-8'));
const tripTypeDefs = gql(fs.readFileSync(path.join(__dirname, 'trip.graphql'), 'utf-8'));

const typeDefsArray = [
  baseTypeDefs,
  userTypeDefs, 
  tripTypeDefs, 
];


module.exports = typeDefsArray;