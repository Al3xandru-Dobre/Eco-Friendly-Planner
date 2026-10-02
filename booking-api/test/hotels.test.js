const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { buildApp, auth, ALICE } = require('./helpers');

describe('hotels', () => {
  let app;
  before(async () => { ({ app } = await buildApp()); });

  test('lists the catalogue sorted by eco score by default', async () => {
    const res = await request(app).get('/api/v1/hotels').expect(200);
    assert.equal(res.body.total, 14);
    const scores = res.body.items.map((h) => h.ecoScore);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.ok(res.body.items[0].lowestPricePerNight > 0);
  });

  test('filters by city case-insensitively and by certification', async () => {
    const byCity = await request(app).get('/api/v1/hotels?city=copenhagen').expect(200);
    assert.equal(byCity.body.total, 2);
    assert.ok(byCity.body.items.every((h) => h.city === 'Copenhagen'));

    const certified = await request(app).get('/api/v1/hotels?certification=LEED,EU_ECOLABEL').expect(200);
    assert.ok(certified.body.total >= 1);
    assert.ok(certified.body.items.every((h) => h.certifications.includes('LEED') && h.certifications.includes('EU_ECOLABEL')));
  });

  test('free-text search and price ceiling', async () => {
    const res = await request(app).get('/api/v1/hotels?q=passive&maxPrice=120').expect(200);
    assert.equal(res.body.total, 1);
    assert.equal(res.body.items[0].id, 'htl-amsterdam-canal-passive');
  });

  test('paginates', async () => {
    const res = await request(app).get('/api/v1/hotels?limit=5&page=3').expect(200);
    assert.equal(res.body.items.length, 4);
    assert.equal(res.body.totalPages, 3);
  });

  test('rejects an invalid sort key and an invalid date', async () => {
    const bad = await request(app).get('/api/v1/hotels?sort=sideways').expect(400);
    assert.equal(bad.body.error.code, 'BAD_REQUEST');
    const badDate = await request(app).get('/api/v1/hotels?checkIn=2026-02-30&checkOut=2026-03-02').expect(400);
    assert.match(badDate.body.error.message, /checkIn/);
  });

  test('404 for unknown hotel', async () => {
    const res = await request(app).get('/api/v1/hotels/htl-nowhere').expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  test('availability reports rooms, totals and eco impact', async () => {
    const res = await request(app)
      .get('/api/v1/hotels/htl-vienna-ringstrasse-climate/availability?checkIn=2026-06-10&checkOut=2026-06-13&guests=2')
      .expect(200);
    assert.equal(res.body.nights, 3);
    const classic = res.body.roomTypes.find((r) => r.code === 'CLASSIC');
    assert.equal(classic.availableRooms, 20);
    assert.equal(classic.total, 175 * 3);
    // 3.6 kg per guest-night x 2 guests x 3 nights = 21.6 kg vs a 120 kg baseline
    assert.equal(classic.ecoImpact.carbonKgCO2e, 21.6);
    assert.equal(classic.ecoImpact.baselineKgCO2e, 120);
    assert.equal(classic.ecoImpact.carbonSavedKgCO2e, 98.4);
  });

  test('availability requires checkOut after checkIn', async () => {
    const res = await request(app)
      .get('/api/v1/hotels/htl-vienna-ringstrasse-climate/availability?checkIn=2026-06-13&checkOut=2026-06-13')
      .expect(400);
    assert.match(res.body.error.message, /at least one day/);
  });

  test('listing with a stay window hides fully booked hotels', async () => {
    // The Brasov forest cabin has 2 rooms; book both, then it must drop out of a 6-guest search.
    const body = { hotelId: 'htl-brasov-carpathian-lodge', roomTypeCode: 'CABIN', checkIn: '2026-07-01', checkOut: '2026-07-04', guests: 6, rooms: 2 };
    await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send(body).expect(201);
    const res = await request(app).get('/api/v1/hotels?city=Bra%C8%99ov&checkIn=2026-07-02&checkOut=2026-07-03&guests=6').expect(200);
    assert.ok(!res.body.items.some((h) => h.id === 'htl-brasov-carpathian-lodge'));
  });
});
