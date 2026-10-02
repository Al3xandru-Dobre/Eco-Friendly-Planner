import { gql } from '../api/graphql';
import { MY_TRIPS } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../lib/useAsync';

/**
 * Loads the signed-in traveller's trips for pickers and lists.
 * Pass `enabled: false` to skip the request (e.g. when a trip is fixed).
 */
export function useMyTrips({ enabled = true } = {}) {
  const { token } = useAuth();
  const { data, error, loading, reload } = useAsync(
    () => gql(MY_TRIPS, {}, token).then((d) => d.getUserTrips || []),
    [token],
    { enabled: Boolean(token) && enabled },
  );
  return { trips: data || [], error, loading, reload };
}
