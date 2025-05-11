import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';
import './App.css';

// Configurează Apollo Client
const client = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql', // Din .env sau default
  cache: new InMemoryCache(),
});

// Exemplu de interogare GraphQL
const HELLO_QUERY = gql`
  query GetHello {
    hello
  }
`;

function DisplayHello() {
  const { loading, error, data } = useQuery(HELLO_QUERY);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :( {error.message}</p>;

  return <h1>{data.hello}</h1>;
}

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <DisplayHello />
          <p>Planificator de călătorii eco-friendly</p>
          {/* Aici vei construi interfața */}
        </header>
      </div>
    </ApolloProvider>
  );
}

export default App;