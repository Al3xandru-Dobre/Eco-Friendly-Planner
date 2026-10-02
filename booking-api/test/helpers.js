const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { createMemoryRepositories } = require('../src/repositories/memory');
const { seedCatalog } = require('../src/data/seed');

const JWT_SECRET = 'test-secret';

async function buildApp() {
  const repos = createMemoryRepositories();
  await seedCatalog(repos, { logger: { log() {} } });
  const config = { jwtSecret: JWT_SECRET, corsOrigin: '*' };
  return { app: createApp({ repos, config }), repos };
}

const ALICE = { id: 'user-alice', email: 'alice@example.com', name: 'Alice' };
const BOB = { id: 'user-bob', email: 'bob@example.com', name: 'Bob' };

const tokenFor = (user) => jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

module.exports = { buildApp, ALICE, BOB, tokenFor, auth, JWT_SECRET };
