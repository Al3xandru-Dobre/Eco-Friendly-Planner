const { optionalInt, oneOf } = require('../utils/validate');
const { SORTERS } = require('../domain/catalogFilters');

/**
 * Sorting and paging happen in the service layer rather than the database.
 * The catalogue is small and availability filtering (which needs booking data)
 * must run before paging anyway, so pushing LIMIT/OFFSET into the query would
 * give wrong totals. If the catalogue grows, this is the place to revisit.
 */
function paginate(items, query, defaultSort = 'ecoScore') {
  const sort = oneOf(query.sort, 'sort', Object.keys(SORTERS), defaultSort);
  const page = optionalInt(query.page, 'page', { min: 1 }) ?? 1;
  const limit = optionalInt(query.limit, 'limit', { min: 1, max: 100 }) ?? 20;
  const sorted = [...items].sort(SORTERS[sort]);
  const start = (page - 1) * limit;
  return {
    items: sorted.slice(start, start + limit),
    page,
    limit,
    total: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / limit)),
    sort,
  };
}

module.exports = { paginate };
