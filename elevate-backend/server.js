require('dotenv').config();

const app = require('./src/app');
const { testConnection, initializePool, closePool } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = Number(process.env.PORT) || 5000;

const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 10000);
const DB_MAX_RETRY_MS = Number(process.env.DB_MAX_RETRY_MS || 60000);
let dbRetryDelayMs = DB_RETRY_MS;

// Initialize database pool
initializePool();

const connectDatabaseWithRetry = async () => {
  return new Promise((resolve) => {
    const attempt = async () => {
      try {
        await testConnection({ silent: true, logErrors: false });
        app.locals.dbReady = true;
        dbRetryDelayMs = DB_RETRY_MS;
        logger.info('Database is connected and ready');
        resolve();
      } catch (error) {
        app.locals.dbReady = false;
        logger.warn('Database unavailable, retry scheduled', {
          code: error.code,
          retryInMs: dbRetryDelayMs
        });
        dbRetryDelayMs = Math.min(dbRetryDelayMs * 2, DB_MAX_RETRY_MS);
        setTimeout(attempt, dbRetryDelayMs);
      }
    };
    attempt();
  });
};

app.locals.dbReady = false;

const startServer = async (port) => {
  await connectDatabaseWithRetry();
  
  const server = app.listen(port, () => {
    logger.info(`Elevate backend running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      logger.warn(`Port ${port} is in use. Retrying on port ${nextPort}`);
      startServer(nextPort);
      return;
    }

    logger.error('Server failed to start', {
      error: error.message || String(error),
      code: error.code
    });
    process.exit(1);
  });
};

startServer(PORT);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  try {
    await closePool();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
