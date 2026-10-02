/* Re-seeds the catalogue from src/data, replacing whatever is stored. Bookings are untouched. */
const { loadConfig } = require('../src/config');
const { createRepositories } = require('../src/repositories');
const { seedCatalog } = require('../src/data/seed');

(async () => {
  const config = loadConfig();
  const repos = await createRepositories(config);
  await seedCatalog(repos, { force: true });
  await repos.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
