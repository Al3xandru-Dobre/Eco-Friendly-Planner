//Daca crapa, trebuie imporatate astea
// const User = require('../../models/User');
// const Trip = require('../../models/Trip');

const { gql } = require('apollo-server-express');

const fs = require ('fs');

const path = require('path');
const baseTypeDefs = gql; //Scalar custom pentru Date (optional de implementat mai tarziu)

//zona pentru resolvere
const userResolver = require('./userResolvers');
const tripResolver = require('./tripResolvers');

const resolvers = {
    Query: {
        ...userResolvers.Query,
        ...tripResolvers.Query,
    },

    Mutation: {
        ...userResolver.Mutation,
        ...tripResolver.Mutation
    }
}


const Query = gql`
  type Query {
    _empty: String
  }
`;
const Mutation = gql`
  type Mutation {
    _empty: String
  }
`;

const userTypeDefs = gql(fs.readFileSync(path.join(__dirname,'./user.graphql'),utf-8));
const tripTypeDefs = gql(fs.readFileSync(path.join(__dirname, './trip.graphql'), 'utf8'));

module.exports = [
    baseTypeDefs,
    userTypeDefs,
    tripTypeDefs,
    resolvers
]
  