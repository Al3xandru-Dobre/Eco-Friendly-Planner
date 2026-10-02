const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { FilterBuilder, MATCH_ALL } = require('../src/domain/filters/FilterBuilder');
const { hotelFilter, restaurantFilter } = require('../src/domain/catalogFilters');
const { buildCatalog } = require('../src/data/seed');

const { hotels, restaurants } = buildCatalog();

describe('FilterBuilder', () => {
  test('absent criteria are skipped, so an empty builder matches everything', () => {
    const spec = new FilterBuilder()
      .equalsIgnoreCase('city', undefined)
      .containsAll('tags', [])
      .atLeast('score', null)
      .textSearch(['name'], '')
      .build();
    assert.equal(spec.isEmpty, true);
    assert.deepEqual(spec.toMongo(), {});
    assert.ok(hotels.every((h) => spec.matches(h)));
    assert.ok(hotels.every((h) => MATCH_ALL.matches(h)));
  });

  test('each criterion produces one predicate and one Mongo clause', () => {
    const spec = new FilterBuilder()
      .equalsIgnoreCase('city', ' vienna ')
      .containsAll('certifications', ['LEED'])
      .atLeast('ecoScore', 80)
      .atMost('lowestPricePerNight', 200)
      .textSearch(['name', 'description'], 'ring')
      .build();
    const { $and: clauses } = spec.toMongo();
    assert.equal(clauses.length, 5);
    assert.ok(clauses[0].city instanceof RegExp && clauses[0].city.test('VIENNA') && !clauses[0].city.test('Vienna Woods'));
    assert.deepEqual(clauses[1], { certifications: { $all: ['LEED'] } });
    assert.deepEqual(clauses[2], { ecoScore: { $gte: 80 } });
    assert.deepEqual(clauses[3], { lowestPricePerNight: { $lte: 200 } });
    assert.equal(clauses[4].$or.length, 2);
    assert.deepEqual(hotels.filter((h) => spec.matches(h)).map((h) => h.id), ['htl-vienna-ringstrasse-climate']);
  });

  test('regex metacharacters in user input are escaped', () => {
    const spec = new FilterBuilder().textSearch(['name'], 'a.*b').build();
    assert.equal(spec.toMongo().$and[0].$or[0].name.source, 'a\\.\\*b');
    assert.equal(spec.matches({ name: 'aXXb' }), false);
    assert.equal(spec.matches({ name: 'the a.*b inn' }), true);
  });

  test('equalsIgnoreCase on an array field matches any element, as MongoDB does', () => {
    const spec = new FilterBuilder().equalsIgnoreCase('cuisine', 'nordic').build();
    assert.equal(spec.matches({ cuisine: ['Nordic', 'Plant-forward'] }), true);
    assert.equal(spec.matches({ cuisine: ['Danish'] }), false);
  });

  test('two clauses on the same field do not overwrite each other', () => {
    const spec = new FilterBuilder().atLeast('ecoScore', 50).atMost('ecoScore', 70).build();
    assert.equal(spec.toMongo().$and.length, 2);
    assert.equal(spec.matches({ ecoScore: 60 }), true);
    assert.equal(spec.matches({ ecoScore: 80 }), false);
  });

  test('built specifications are immutable and independent of later builder calls', () => {
    const builder = new FilterBuilder().atLeast('rating', 4.5);
    const first = builder.build();
    builder.atLeast('ecoScore', 99);
    assert.equal(first.toMongo().$and.length, 1);
    assert.ok(Object.isFrozen(first));
  });
});

describe('catalogue filters', () => {
  test('hotelFilter combines criteria with AND', () => {
    const spec = hotelFilter({ country: 'romania', features: ['EV_CHARGING'], maxPrice: 400 });
    assert.deepEqual(hotels.filter((h) => spec.matches(h)).map((h) => h.id).sort(), ['htl-brasov-carpathian-lodge', 'htl-cluj-botanic-house']);
  });

  test('restaurantFilter searches cuisine text and dietary options', () => {
    const spec = restaurantFilter({ q: 'plant', dietary: ['VEGAN'], maxPriceLevel: 2 });
    assert.deepEqual(restaurants.filter((r) => spec.matches(r)).map((r) => r.id), ['rst-lisbon-horta-do-tejo']);
  });
});
