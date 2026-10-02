const { createMemoryRepositories } = require('./memory');

/**
 * Factory selecting the storage driver. Everything above this line only ever
 * sees the repository interface, never Mongoose, so swapping drivers is a
 * configuration change rather than a code change.
 */
async function createRepositories(config) {
  if (config.dataDriver === 'memory') return createMemoryRepositories();
  if (config.dataDriver === 'mongo') {
    const { createMongoRepositories } = require('./mongo');
    return createMongoRepositories({ mongoUri: config.mongoUri });
  }
  throw new Error(`Unknown DATA_DRIVER "${config.dataDriver}" (expected "mongo" or "memory")`);
}

module.exports = { createRepositories };
