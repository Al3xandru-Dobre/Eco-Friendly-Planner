const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { buildApp } = require('./helpers');
const { slotsForDay } = require('../src/services/restaurantService');

describe('restaurants', () => {
  let app;
  before(async () => { ({ app } = await buildApp()); });

  test('lists and filters by dietary options and cuisine', async () => {
    const all = await request(app).get('/api/v1/restaurants').expect(200);
    assert.equal(all.body.total, 14);
    const vegan = await request(app).get('/api/v1/restaurants?dietary=VEGAN,GLUTEN_FREE&maxPriceLevel=2').expect(200);
    assert.ok(vegan.body.total >= 1);
    assert.ok(vegan.body.items.every((r) => r.dietaryOptions.includes('VEGAN') && r.dietaryOptions.includes('GLUTEN_FREE') && r.priceLevel <= 2));
    const nordic = await request(app).get('/api/v1/restaurants?cuisine=nordic').expect(200);
    assert.equal(nordic.body.items[0].id, 'rst-copenhagen-tang');
  });

  test('slot generation respects opening hours and the seating length', () => {
    const restaurant = { openingHours: [{ days: [1], open: '12:00', close: '15:00' }, { days: [1], open: '18:00', close: '22:30' }] };
    const monday = slotsForDay(restaurant, 1);
    // 12:00..13:30 (last start that ends by 15:00) and 18:00..21:00
    assert.deepEqual(monday, ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']);
    assert.deepEqual(slotsForDay(restaurant, 2), []);
  });

  test('availability is empty on a closed day', async () => {
    // Tang & Rodfrugt is closed on Mondays; 2026-06-15 is a Monday.
    const res = await request(app).get('/api/v1/restaurants/rst-copenhagen-tang/availability?date=2026-06-15&partySize=2').expect(200);
    assert.equal(res.body.open, false);
    assert.deepEqual(res.body.slots, []);
  });

  test('availability lists slots with seats and eco impact', async () => {
    const res = await request(app).get('/api/v1/restaurants/rst-copenhagen-tang/availability?date=2026-06-16&partySize=4').expect(200);
    assert.equal(res.body.open, true);
    assert.equal(res.body.slots[0].time, '17:30');
    assert.equal(res.body.slots[0].availableSeats, 34);
    assert.equal(res.body.ecoImpact.carbonKgCO2e, 5.6);
    assert.equal(res.body.estimatedTotal, 58 * 4);
  });

  test('date filter on the listing removes closed restaurants', async () => {
    const res = await request(app).get('/api/v1/restaurants?city=Copenhagen&date=2026-06-15&partySize=2').expect(200);
    assert.deepEqual(res.body.items.map((r) => r.id), ['rst-copenhagen-rescue-kitchen']);
  });
});
