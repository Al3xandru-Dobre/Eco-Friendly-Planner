/**
 * FilterBuilder: a fluent Builder that assembles a catalogue filter from
 * optional criteria, then compiles it into a Specification.
 *
 * Why this shape:
 *   - Every criterion is optional. Instead of repeating `if (value) ...` once
 *     per field and once per storage engine, each builder method skips itself
 *     when its value is absent. That rule exists in exactly one place
 *     (`#add`), so a new filter is one chained call, not two new `if` blocks.
 *   - Each criterion is compiled to BOTH representations at the moment it is
 *     added: an in-memory predicate and a MongoDB clause. The two can no
 *     longer drift apart, because they are produced by the same operator.
 *
 * The result of `build()` is a Specification object:
 *   { matches(doc) -> boolean, toMongo() -> object, isEmpty }
 * which repositories consume without knowing which criteria were used.
 */

const isAbsent = (value) => value === undefined || value === null || value === ''
  || (Array.isArray(value) && value.length === 0);

const lower = (value) => String(value).trim().toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value : [value]);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Operator table (Strategy pattern). Each entry turns (field, value) into a
 * predicate and a Mongo clause. Array-valued document fields are handled the
 * way MongoDB handles them: a scalar condition matches if ANY element does.
 */
const OPERATORS = {
  equalsIgnoreCase: {
    predicate: (field, value) => (doc) => asArray(doc[field] ?? []).some((v) => lower(v) === lower(value)),
    mongo: (field, value) => ({ [field]: new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i') }),
  },
  containsAll: {
    predicate: (field, values) => (doc) => values.every((v) => (doc[field] || []).includes(v)),
    mongo: (field, values) => ({ [field]: { $all: values } }),
  },
  atLeast: {
    predicate: (field, min) => (doc) => typeof doc[field] === 'number' && doc[field] >= min,
    mongo: (field, min) => ({ [field]: { $gte: min } }),
  },
  atMost: {
    predicate: (field, max) => (doc) => typeof doc[field] === 'number' && doc[field] <= max,
    mongo: (field, max) => ({ [field]: { $lte: max } }),
  },
  textSearch: {
    predicate: (fields, text) => {
      const needle = lower(text);
      return (doc) => fields.some((f) => asArray(doc[f] ?? []).some((v) => lower(v).includes(needle)));
    },
    mongo: (fields, text) => {
      const re = new RegExp(escapeRegex(String(text).trim()), 'i');
      return { $or: fields.map((f) => ({ [f]: re })) };
    },
  },
};

class FilterBuilder {
  #predicates = [];

  #clauses = [];

  #add(operator, field, value) {
    if (isAbsent(value)) return this;
    const op = OPERATORS[operator];
    this.#predicates.push(op.predicate(field, value));
    this.#clauses.push(op.mongo(field, value));
    return this;
  }

  /** Case-insensitive exact match; on an array field, any element may match. */
  equalsIgnoreCase(field, value) { return this.#add('equalsIgnoreCase', field, value); }

  /** Document array must contain every requested value. */
  containsAll(field, values) { return this.#add('containsAll', field, values); }

  /** Numeric lower bound (inclusive). */
  atLeast(field, min) { return this.#add('atLeast', field, min); }

  /** Numeric upper bound (inclusive). */
  atMost(field, max) { return this.#add('atMost', field, max); }

  /** Case-insensitive substring search across several fields. */
  textSearch(fields, text) { return this.#add('textSearch', fields, text); }

  build() {
    const predicates = [...this.#predicates];
    const clauses = [...this.#clauses];
    return Object.freeze({
      isEmpty: predicates.length === 0,
      matches: (doc) => predicates.every((p) => p(doc)),
      // $and keeps clauses independent, so two criteria on the same field
      // (or two $or groups) can never overwrite each other.
      toMongo: () => (clauses.length ? { $and: clauses } : {}),
    });
  }
}

/** Specification matching every document; the default for unfiltered reads. */
const MATCH_ALL = new FilterBuilder().build();

module.exports = { FilterBuilder, MATCH_ALL, OPERATORS };
