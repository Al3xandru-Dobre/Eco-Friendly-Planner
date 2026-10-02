const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { buildApp } = require('./helpers');
const { computeVenueEcoScore } = require('../src/domain/ecoImpact');

describe('catalogue and meta endpoints', () => {
  let app;
  before(async () => { ({ app } = await buildApp()); });

  test('health reports the driver and catalogue size', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.body.driver, 'memory');
    assert.deepEqual(res.body.catalogue, { hotels: 14, restaurants: 14 });
  });

  test('destinations aggregate venues per city', async () => {
    const res = await request(app).get('/api/v1/destinations').expect(200);
    const brasov = res.body.items.find((d) => d.city === 'Brașov');
    assert.deepEqual({ hotels: brasov.hotels, restaurants: brasov.restaurants }, { hotels: 2, restaurants: 2 });
  });

  test('reference data and openapi are served', async () => {
    const ref = await request(app).get('/api/v1/reference').expect(200);
    assert.ok(ref.body.hotelCertifications.includes('GREEN_KEY'));
    const spec = await request(app).get('/api/v1/openapi.json').expect(200);
    assert.equal(spec.body.openapi, '3.0.3');
    assert.ok(spec.body.paths['/bookings/hotels']);
    await request(app).get('/api/v1/docs').expect(200).expect('Content-Type', /html/);
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/v1/nothing-here').expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  test('eco score weights carbon, certifications and features as documented', () => {
    assert.equal(computeVenueEcoScore({ carbonKgPerUnit: 20, baselineKgPerUnit: 20 }), 0);
    assert.equal(computeVenueEcoScore({ carbonKgPerUnit: 0, baselineKgPerUnit: 20 }), 60);
    assert.equal(computeVenueEcoScore({ carbonKgPerUnit: 10, baselineKgPerUnit: 20, certifications: ['A', 'B', 'C', 'D'], features: new Array(10).fill('x') }), 30 + 24 + 16);
  });
});
