const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
require('dotenv').config();

//REMINDER PT MAINE
//ACTUALIZAT SERVER CA SA POT SA SI EXTRAG TOKEN JWT din headere si actualizeaza contextul utilizatorului

const connectDB = require('./config/db');
const typeDefs = require('./graphql/schemas'); // Va lua index.js din schemas
const resolvers = require('./graphql/resolvers'); // Va lua index.js din resolvers

const jwt = require('jsonwebtoken');

// Conectare la MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); // Permite cereri cross-origin
app.use(express.json()); // Pentru a parsa JSON bodies

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Poți extrage token-ul de autentificare din header și adăuga user-ul la context
      // const token = req.headers.authorization || '';
      // const user = getUserFromToken(token); // Implementează getUserFromToken
      
      const autoHeader = req.header.autorization || ''
      let user = null ; //initialziam un utilizator gol pentru a-l maniupla apoi cu cerintele si inputul utilizatorului

      if(autoHeader){
        const token = autoHeader.split('Bearer ')[1]

        if(token) {
          try {
            const decode = jwt.verify(token,process.env.JWT_SECRET)
            user = decode;
          } catch (err){
            console.warn('Token expirat sau invalid')
          }
        }
      }
      return {user,req};

    },

    
    // Activează introspection pentru development (GraphQL Playground / Apollo Studio)
    introspection: process.env.NODE_ENV !== 'production',
    // playground: process.env.NODE_ENV !== 'production', // Pentru Apollo Server v2.x
                                                        // Apollo Server v3 folosește Apollo Sandbox by default
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' }); // Setează endpoint-ul GraphQL la /graphql

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`Server pornit pe http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startApolloServer();