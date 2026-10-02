import { GRAPHQL_URL } from './config';

export class GraphQLError extends Error {
  constructor(message, { code, errors } = {}) {
    super(message);
    this.name = 'GraphQLError';
    this.code = code;
    this.errors = errors;
  }
}

/**
 * Minimal GraphQL transport. Apollo Client would add caching and a lot of
 * weight; for this app a fetch wrapper that surfaces the first error message
 * and the error code is enough and keeps the dependency tree small.
 */
export async function gql(query, variables = {}, token) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new GraphQLError(`Planner API returned ${res.status}`);
  }
  if (payload.errors && payload.errors.length) {
    const first = payload.errors[0];
    throw new GraphQLError(first.message, { code: first.extensions?.code, errors: payload.errors });
  }
  if (!res.ok) throw new GraphQLError(`Planner API returned ${res.status}`);
  return payload.data;
}
