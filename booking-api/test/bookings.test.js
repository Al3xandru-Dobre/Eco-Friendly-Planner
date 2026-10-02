const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { buildApp, auth, ALICE, BOB, JWT_SECRET } = require('./helpers');

const HOTEL = { hotelId: 'htl-copenhagen-harbour-lofts', roomTypeCode: 'FAMILY', checkIn: '2026-08-01', checkOut: '2026-08-04', guests: 4, tripId: 'trip-1' };
const TABLE = { restaurantId: 'rst-copenhagen-tang', date: '2026-08-02', time: '19:00', partySize: 4, tripId: 'trip-1' };

describe('bookings', () => {
  let app;
  beforeEach(async () => { ({ app } = await buildApp()); });

  test('requires a valid planner token', async () => {
    await request(app).get('/api/v1/bookings').expect(401);
    await request(app).post('/api/v1/bookings/hotels').send(HOTEL).expect(401);
    const expired = jwt.sign(ALICE, JWT_SECRET, { expiresIn: -10 });
    await request(app).get('/api/v1/bookings').set('Authorization', `Bearer ${expired}`).expect(401);
    const wrongSecret = jwt.sign(ALICE, 'other-secret');
    await request(app).get('/api/v1/bookings').set('Authorization', `Bearer ${wrongSecret}`).expect(401);
  });

  test('books a hotel room and decrements availability', async () => {
    const created = await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send(HOTEL).expect(201);
    assert.equal(created.body.type, 'HOTEL');
    assert.equal(created.body.status, 'CONFIRMED');
    assert.match(created.body.reference, /^ECO-[A-Z2-9]{6}$/);
    assert.equal(created.body.hotel.nights, 3);
    assert.equal(created.body.hotel.checkIn, '2026-08-01');
    assert.equal(created.body.pricing.total, 259 * 3);
    assert.equal(created.body.ecoImpact.carbonKgCO2e, 6.2 * 4 * 3);
    assert.equal(created.body.venue.name, 'Harbour Lofts Copenhagen');

    const availability = await request(app)
      .get(`/api/v1/hotels/${HOTEL.hotelId}/availability?checkIn=2026-08-03&checkOut=2026-08-05&guests=2`).expect(200);
    const family = availability.body.roomTypes.find((r) => r.code === 'FAMILY');
    assert.equal(family.availableRooms, 2);

    // A stay that starts on the check-out day does not overlap.
    const after = await request(app)
      .get(`/api/v1/hotels/${HOTEL.hotelId}/availability?checkIn=2026-08-04&checkOut=2026-08-06&guests=2`).expect(200);
    assert.equal(after.body.roomTypes.find((r) => r.code === 'FAMILY').availableRooms, 3);
  });

  test('refuses to overbook a room type', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send(HOTEL).expect(201);
    }
    const res = await request(app).post('/api/v1/bookings/hotels').set(auth(BOB)).send(HOTEL).expect(409);
    assert.equal(res.body.error.code, 'CONFLICT');
    assert.equal(res.body.error.details.availableRooms, 0);
  });

  test('validates hotel booking input', async () => {
    const tooMany = await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send({ ...HOTEL, roomTypeCode: 'LOFT_S', guests: 3 }).expect(400);
    assert.equal(tooMany.body.error.details.field, 'guests');
    const unknownRoom = await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send({ ...HOTEL, roomTypeCode: 'PENTHOUSE' }).expect(400);
    assert.equal(unknownRoom.body.error.details.field, 'roomTypeCode');
    await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send({ ...HOTEL, hotelId: 'htl-missing' }).expect(404);
    const badJson = await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).set('Content-Type', 'application/json').send('{"oops"').expect(400);
    assert.match(badJson.body.error.message, /JSON/);
  });

  test('reserves a table, fills the slot, then frees it on cancel', async () => {
    // Tang & Rodfrugt seats 34. Three parties of 10 at 19:00 leave 4 seats.
    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/api/v1/bookings/restaurants').set(auth(ALICE)).send({ ...TABLE, partySize: 10 }).expect(201);
    }
    const ok = await request(app).post('/api/v1/bookings/restaurants').set(auth(BOB)).send(TABLE).expect(201);
    assert.equal(ok.body.restaurant.partySize, 4);
    assert.equal(ok.body.ecoImpact.carbonKgCO2e, 5.6);

    // Now the 19:00 slot is full, and so is the overlapping 20:00 slot (90 min seating).
    const full = await request(app).post('/api/v1/bookings/restaurants').set(auth(BOB)).send({ ...TABLE, partySize: 1 }).expect(409);
    assert.equal(full.body.error.details.availableSeats, 0);
    const slots = await request(app).get(`/api/v1/restaurants/${TABLE.restaurantId}/availability?date=2026-08-02&partySize=1`).expect(200);
    const byTime = Object.fromEntries(slots.body.slots.map((s) => [s.time, s.availableSeats]));
    assert.equal(byTime['19:00'], 0);
    assert.equal(byTime['20:00'], 0);
    assert.equal(byTime['20:30'], 34);
    assert.equal(byTime['17:30'], 34);

    await request(app).delete(`/api/v1/bookings/${ok.body.id}`).set(auth(BOB)).expect(200);
    const freed = await request(app).get(`/api/v1/restaurants/${TABLE.restaurantId}/availability?date=2026-08-02&partySize=1`).expect(200);
    assert.equal(freed.body.slots.find((s) => s.time === '19:00').availableSeats, 4);
  });

  test('rejects a time the restaurant does not serve', async () => {
    const res = await request(app).post('/api/v1/bookings/restaurants').set(auth(ALICE)).send({ ...TABLE, time: '09:00' }).expect(400);
    assert.equal(res.body.error.details.field, 'time');
    assert.ok(Array.isArray(res.body.error.details.slots));
  });

  test('lists, filters and summarises my bookings per trip', async () => {
    await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send(HOTEL).expect(201);
    const dinner = await request(app).post('/api/v1/bookings/restaurants').set(auth(ALICE)).send(TABLE).expect(201);
    await request(app).post('/api/v1/bookings/restaurants').set(auth(ALICE)).send({ ...TABLE, tripId: 'trip-2' }).expect(201);
    await request(app).post('/api/v1/bookings/hotels').set(auth(BOB)).send(HOTEL).expect(201);
    await request(app).delete(`/api/v1/bookings/${dinner.body.id}`).set(auth(ALICE)).expect(200);

    const mine = await request(app).get('/api/v1/bookings').set(auth(ALICE)).expect(200);
    assert.equal(mine.body.total, 3);
    const trip1 = await request(app).get('/api/v1/bookings?tripId=trip-1').set(auth(ALICE)).expect(200);
    assert.equal(trip1.body.total, 2);
    const confirmedHotels = await request(app).get('/api/v1/bookings?type=HOTEL&status=CONFIRMED').set(auth(ALICE)).expect(200);
    assert.equal(confirmedHotels.body.total, 1);

    const summary = await request(app).get('/api/v1/bookings/summary?tripId=trip-1').set(auth(ALICE)).expect(200);
    assert.equal(summary.body.count, 2);
    assert.equal(summary.body.confirmedCount, 1);
    assert.equal(summary.body.cancelledCount, 1);
    assert.equal(summary.body.hotelNights, 3);
    assert.equal(summary.body.restaurantCovers, 0);
    assert.deepEqual(summary.body.totalsByCurrency, { EUR: 777 });
    assert.equal(summary.body.carbonKgCO2e, 74.4);
    assert.equal(summary.body.carbonSavedKgCO2e, 165.6);
  });

  test('other travellers cannot read or cancel my booking', async () => {
    const mine = await request(app).post('/api/v1/bookings/hotels').set(auth(ALICE)).send(HOTEL).expect(201);
    await request(app).get(`/api/v1/bookings/${mine.body.id}`).set(auth(BOB)).expect(403);
    await request(app).delete(`/api/v1/bookings/${mine.body.id}`).set(auth(BOB)).expect(403);
    await request(app).get('/api/v1/bookings/does-not-exist').set(auth(ALICE)).expect(404);
    // Cancelling twice is idempotent.
    const first = await request(app).delete(`/api/v1/bookings/${mine.body.id}`).set(auth(ALICE)).expect(200);
    assert.equal(first.body.status, 'CANCELLED');
    const second = await request(app).delete(`/api/v1/bookings/${mine.body.id}`).set(auth(ALICE)).expect(200);
    assert.equal(second.body.cancelledAt, first.body.cancelledAt);
  });
});
