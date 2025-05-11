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

console.log('--- SCHEMAS INDEX.JS ---');
console.log('Type of baseTypeDefs:', typeof baseTypeDefs);
console.log('Kind of baseTypeDefs:', baseTypeDefs ? baseTypeDefs.kind : 'undefined');
console.log('Is baseTypeDefs an array:', Array.isArray(baseTypeDefs));


const userTypeDefs = gql(fs.readFileSync(path.join(__dirname, 'user.graphql'), 'utf-8'));
const tripTypeDefs = gql(fs.readFileSync(path.join(__dirname, 'trip.graphql'), 'utf-8'));

const typeDefsArray = [
  baseTypeDefs,
  userTypeDefs, 
  tripTypeDefs, 
];

console.log('Exporting typeDefsArray:', typeDefsArray);
typeDefsArray.forEach((item, index) => {
  console.log(`Item ${index} type:`, typeof item, item ? item.kind : 'undefined');
});


module.exports = typeDefsArray;