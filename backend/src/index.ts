import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { pool } from './db/pool';

async function start() {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  app.listen(config.port, () => {
    logger.info(`Away Intelligence API running on port ${config.port}`);
  });
}

start();
