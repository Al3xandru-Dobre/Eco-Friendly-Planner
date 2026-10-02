const { loadConfig } = require('./config');
const { createRepositories } = require('./repositories');
const { seedCatalog } = require('./data/seed');
const { createApp } = require('./app');

async function main() {
  const config = loadConfig();
  if (!config.jwtSecret) {
    console.error('[booking-api] JWT_SECRET is not set; refusing to start without it');
    process.exit(1);
  }

  const repos = await createRepositories(config);
  console.log(`[booking-api] storage driver: ${repos.driver}`);

  if (config.seedOnStart) await seedCatalog(repos);

  const app = createApp({ repos, config });
  const server = app.listen(config.port, () => {
    console.log(`[booking-api] listening on http://localhost:${config.port}/api/v1 (docs at /api/v1/docs)`);
  });

  const shutdown = async (signal) => {
    console.log(`[booking-api] ${signal} received, shutting down`);
    server.close(async () => {
      await repos.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[booking-api] failed to start', err);
  process.exit(1);
});
