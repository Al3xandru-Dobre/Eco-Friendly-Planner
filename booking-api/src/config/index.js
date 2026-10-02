require('dotenv').config();

/**
 * Central configuration. Every value is read once so the rest of the code
 * never touches process.env directly; this makes the app factory testable
 * (tests pass an explicit config object instead of mutating the environment).
 */
function loadConfig(overrides = {}) {
  const env = process.env;
  return {
    env: env.NODE_ENV || 'development',
    port: Number(env.PORT) || 5000,
    mongoUri: env.MONGO_URI || 'mongodb://localhost:27017/eco_bookings',
    jwtSecret: env.JWT_SECRET,
    dataDriver: env.DATA_DRIVER || 'mongo',
    seedOnStart: (env.SEED_ON_START ?? 'true') === 'true',
    corsOrigin: env.CORS_ORIGIN || '*',
    ...overrides,
  };
}

module.exports = { loadConfig };
